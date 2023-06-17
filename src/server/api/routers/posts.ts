import { z } from "zod";
import type { User } from "@clerk/backend/dist/types";
import { clerkClient } from "@clerk/nextjs/server"
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";

const mapUserForClient = (user: User) => {
  return {
    id: user.id,
    username: user.username,
    profileImageUrl: user.profileImageUrl,
  }
}

export const postsRouter = createTRPCRouter({
  getAll: publicProcedure.query(async ({ctx}) => {
    const posts = await ctx.prisma.post.findMany({
      take: 100,
    });
    const users = (
      await clerkClient.users.getUserList({
        userId: posts.map(post => post.authorId),
        limit: 100,
      })
    ).map(mapUserForClient);
    return posts.map(post => {
      const author = users.find((user) => user.id === post.authorId);
      if (!author) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "No posts found for user"

        });
      }
      return {
        post,
        author,
      };
    });
  }),
});
