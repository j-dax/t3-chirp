import { SignInButton, useUser } from "@clerk/nextjs";
import Image from "next/image";
import { api, type RouterOutputs } from "~/utils/api";
import relativeTime from "dayjs/plugin/relativeTime";
import { SpinnerPage, Spinner } from "~/components/spinner";
import { useState } from "react";
import toast from "react-hot-toast"

import dayjs from "dayjs";
import Link from "next/link";
import PageLayout from "~/components/layout";
dayjs.extend(relativeTime);

const CreatePostWizard = () => {
  // TODO: this rerenders on input mutation 
  //  cull useState in favor of zod and react hook form
  //  This currently results in sticky-key behavior. empty while editing then appearing all at once
  const [ input, setInput ] = useState("");
  const {user} = useUser();
  if (!user) return null;

  const ctx = api.useContext();
  const { mutate, isLoading: isPosting } = api.posts.create.useMutation({
    onSuccess: () => {
      setInput("");
      void ctx.posts.getAll.invalidate();
    },
    onError: (e) => {
      const errorMessage = e.data?.zodError?.fieldErrors.content;
      if (errorMessage && errorMessage[0]) {
        toast.error(errorMessage[0]);
      } else {
        toast.error("Failed to post! Please try again later.");
      }
    }
  });
  return <div className="flex justify-center w-full gap-3">
    <Image
      src={user.profileImageUrl}
      alt="Profile image"
      className="h-16 w-16 rounded-full"
      width="56"
      height="56" />
    <input
      placeholder="Type some emojis!"
      className="grow bg-transparent"
      value={input}
      onChange={ (e) => setInput(e.target.value) }
      onKeyDown={ (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          if (input !== "") {
            mutate({ content: input });
          }
        }
      }}
      disabled={isPosting}
    />
    { input != "" && !isPosting &&
      <button
        onClick={() => mutate({ content: input })}
        disabled={isPosting}
      >Post</button>
    }
    { isPosting &&
      <div className="flex items-center justify-center">
        <Spinner size={1000} />
      </div>
    }
  </div>
}

type PostWithUser = RouterOutputs["posts"]["getAll"][number];
const PostView = (props: PostWithUser) => {
  const {author, post} = props;
  return <div className="border-b border-slate-400 p-4 flex gap-3">
    <Image src={author.profileImageUrl} alt="Author's profile picture" className="h-16 w-16 rounded-full" width="56" height="56" />
    <div className="flex flex-col">
      <div className="flex text-slate-300">
        <Link passHref href={`/@${author.username}`}>
          <span>@{`${author.username}`} · {dayjs(post.createdAt).fromNow()}</span>
        </Link>
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
      {data.map((props: PostWithUser) => (
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
  return <PageLayout>
      <div className="flex border-b border-slate-400 p-3">
        { !isSignedIn && <SignInButton /> }
        { isSignedIn && <CreatePostWizard /> }
      </div>
      <Feed />
    </PageLayout>;
}
