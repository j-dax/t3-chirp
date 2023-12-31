import Head from "next/head";
import { api, type RouterOutputs } from "~/utils/api";
import PageLayout from "~/components/layout";
import type { NextPage } from "next";
import Image from "next/image";
import { SpinnerPage } from "~/components/spinner";
import { PostView } from "~/components/PostView";

type PostWithUser = RouterOutputs["posts"]["getPostsByUserId"][number];
const ProfileFeed = (props: {userId: string}) => {
  const {data, isLoading} = api.posts.getPostsByUserId.useQuery({
    userId: props.userId,
  });
  if (isLoading) return <SpinnerPage />;
  if (!data || data.length == 0) return <div>User has not posted.</div>;
  return <>
    <div className="flex flex-col">
      {data.map((fullPost: PostWithUser) => <PostView key={fullPost.author.id} {...fullPost} />)}
    </div>
  </>;
}

const ProfilePage: NextPage<{username: string}> = ({ username }) => {
  const {data: user, isLoading: userLoading} = api.profile.getUserByUsername.useQuery({
    username: username,
  });
  if (userLoading) return <div>Loading...</div>;
  if (!user) return <div>404</div>;
  return (
    <>
      <Head>
        <title>{username}&apos;s Profile Page</title>
      </Head>
      <PageLayout>
        <div className="relative h-48 bg-slate-600">
          <Image
            src={user.profileImageUrl}
            alt={`@${username}'s profile picture`}
            width={128} height={128}
            className="rounded-full absolute bottom-0 left-0 -mb-16 ml-4 border-4 border-black bg-black" />
        </div>
        <div className="h-[64px]"></div>
        <div className="p-4 text-2xl font-bold">@{username}</div>
        <div className="border-b border-slate-400"></div>
        <ProfileFeed userId={user.id} />
      </PageLayout>
    </>
  );
}
export default ProfilePage;

import { GetSSGHelper } from "~/server/api/ssg";
import type { GetStaticProps } from "next";
export const getStaticProps: GetStaticProps = async (context) => {
  const ssg = GetSSGHelper();
  const slug = context.params?.slug;
  if (typeof slug !== "string") throw new Error("no slug");
  const username = slug.replace("@", "");

  await ssg.profile.getUserByUsername.prefetch({ username });

  return {
    props: {
      trpcState: ssg.dehydrate(),
      username,
    },
  }
}

export const getStaticPaths = () => {
  return {
    paths: [],
    fallback: "blocking",
  }
}
