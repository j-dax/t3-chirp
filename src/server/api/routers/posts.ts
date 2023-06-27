import { z } from "zod";
import { clerkClient } from "@clerk/nextjs/server"
import { createTRPCRouter, privateProcedure, publicProcedure } from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { mapUserForClient } from "./filter";

import type { Post } from "@prisma/client";
const addUserDataToPosts = async (posts: Post[]) => {
  const userId = posts.map((post) => post.authorId);
  const users = (await clerkClient.users.getUserList({
    userId,
    limit: 110,
  })).map(mapUserForClient);
  return posts.map((post) => {
    const author = users.find((user) => user.id === post.authorId);
    if (!author) {
      console.error("AUTHOR NOT FOUND", post);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `Author for post not found. POST ID: ${post.id}, USER ID: ${post.authorId}`,
      }); 
    }
    if (!author.username) {
      if (!author.externalUsername) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Author has no GitHub Account: ${author.id}`,
        });
      }
      author.username = author.externalUsername;
    }
    return {
      post,
      author: {
        ...author,
        username: author.username ?? "(username not found)",
      }
    }
  })
}

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis/nodejs";
// Restrict the number of posts per user
const rateLimiter = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(3, "1 m"),
  analytics: true,
})

export const postsRouter = createTRPCRouter({
  getAll: publicProcedure
    .query(async ({ctx}) => ctx.prisma.post.findMany({
        take: 100,
        orderBy: [{ createdAt: "desc" }],
      }).then(addUserDataToPosts)
    ),
  getPostsByUserId: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(({ctx, input}) => ctx.prisma.post.findMany({
        where: { authorId: input.userId },
        take: 100,
        orderBy: [{ createdAt: "desc" }]
      }).then(addUserDataToPosts)
    ),
  create: privateProcedure
    .input(
      z.object({
        content: z.string().emoji("Only emoji are allowed").min(1).max(280),
      }))
    .mutation(async ({ctx, input}) => {
      const authorId = ctx.userId;
      
      const { success } = await rateLimiter.limit(ctx.userId);
      if (!success) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: `Too many requests sent from ${ctx.userId}`
        });  
      }
    
      const post = await ctx.prisma.post.create({
        data: {
          authorId,
          content: input.content
        }
      });
      return post;
    }),
  
});
