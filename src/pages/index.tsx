import { SignInButton, useUser } from "@clerk/nextjs";
import Image from "next/image";
import Head from "next/head";
import { api, RouterOutputs } from "~/utils/api";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { SpinnerPage } from "~/components/spinner";

dayjs.extend(relativeTime);

const CreatePostWizard = () => {
  const {user} = useUser();
  if (!user) return null;

  return <div className="flex gap-3">
    <Image src={user.profileImageUrl} alt="Profile image" className="h-16 w-16 rounded-full" width="56" height="56" />
    <input placeholder="Type some emojis!" className="grow bg-transparent" />
  </div>
}

type PostWithUser = RouterOutputs["posts"]["getAll"][number];
const PostView = (props: PostWithUser) => {
  const {author, post} = props;
  return <div className="border-b border-slate-400 p-4 flex gap-3">
    <Image src={author.profileImageUrl} alt="Author's profile picture" className="h-16 w-16 rounded-full" width="56" height="56" />
    <div className="flex flex-col">
      <div className="flex text-slate-300">
        <span><a href={`https://github.com/${author.username}`}>@{author.username}</a> · {dayjs(post.createdAt).fromNow()}</span>
      </div>
      <span className="text-2xl">{`${post.content}`}</span>
    </div>
  </div>
}

const Feed = () => {
  const { data, isLoading: postsLoading } = api.posts.getAll.useQuery();
  if (postsLoading) return <SpinnerPage />;
  if (!data) return <div>Something went wrong!</div>;
  return <div className="flex flex-col">
      {data?.map((props: any) => (
        <PostView key={props.post.id} {...props} />
      ))}
    </div>

}

export default function Home() {
  const { isSignedIn, isLoaded: userLoaded } = useUser();

  // prepare fetch asap
  api.posts.getAll.useQuery();

  // return an empty div if user isn't loaded yet
  if (!userLoaded) return <div />
  return (
    <>
      <Head>
        <title>Create T3 App</title>
        <meta name="description" content="Generated by create-t3-app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="flex h-screen justify-center">
        <div className="w-full h-full border-x border-slate-400 md:max-w-3xl">
          <div className="flex border-b border-slate-400 p-3">
            {!isSignedIn && <SignInButton />}
            {isSignedIn && (
              <div className="flex justify-center">
                <CreatePostWizard />
                <Feed />
              </div>)
            }
          </div>
          </div>
      </main>
    </>
  );
}
