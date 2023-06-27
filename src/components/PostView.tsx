import Image from "next/image";
import { api, type RouterOutputs } from "~/utils/api";
import { Spinner } from "~/components/spinner";
import Link from "next/link";

import relativeTime from "dayjs/plugin/relativeTime";
import dayjs from "dayjs";
dayjs.extend(relativeTime);

type PostWithUser = RouterOutputs["posts"]["getAll"][number];
export const PostView = (props: PostWithUser) => {
  const {author, post} = props;
  return <div className="border-b border-slate-400 p-4 flex gap-3">
    <Image src={author.profileImageUrl} alt="Author's profile picture" className="h-16 w-16 rounded-full" width="56" height="56" />
    <div className="flex flex-col w-full">
      <Link passHref href={`/post/${post.id}`}>
      <div className="flex text-slate-300">
        <Link passHref href={`/@${author.username}`}>
          <span>@{`${author.username}`} · {dayjs(post.createdAt).fromNow()}</span>
        </Link>
      </div>
        <span className="text-2xl">{`${post.content}`}</span>
      </Link>
    </div>
  </div>
}

export const Feed = () => {
  const { data, isLoading: postsLoading } = api.posts.getAll.useQuery();
  if (postsLoading) return <Spinner />;
  if (!data) return <div>Something went wrong!</div>;
  return <div className="flex flex-col w-full h-full">
      {data.map((props: PostWithUser) => (
        <PostView key={props.post.id} {...props} />
      ))}
    </div>
}
