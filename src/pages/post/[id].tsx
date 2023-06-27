import Head from "next/head";
import { api } from "~/utils/api";
import PageLayout from "~/components/layout";
import type { NextPage } from "next";

const SinglePostPage: NextPage<{id: string}> = ({ id }) => {
  const {data, isLoading: dataLoading} = api.posts.getById.useQuery({ id });

  console.log(data);
  if (dataLoading) return <div>Loading...</div>;
  if (!data || !data[0] || data.length === 0) return <div>404</div>;
  const {post, author} = data[0];
  return <>
    <Head>
      <title>{`${post.content} - @${author.username}`}</title>
    </Head>
    <PageLayout>
      <PostView post={post} author={author} />
    </PageLayout>
  </>;
}
export default SinglePostPage;

import { GetSSGHelper } from "~/server/api/ssg";
import type { GetStaticProps } from "next";
import { PostView } from "~/components/PostView";
export const getStaticProps: GetStaticProps = async (context) => {
  const ssg = GetSSGHelper();
  const id = context.params?.id;
  if (typeof id !== "string") throw new Error("no id");

  await ssg.posts.getById.prefetch({ id });

  return {
    props: {
      trpcState: ssg.dehydrate(),
      id,
    },
  }
}

export const getStaticPaths = () => {
  return {
    paths: [],
    fallback: "blocking",
  }
}
