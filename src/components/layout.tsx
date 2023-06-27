import { PropsWithChildren } from "react";

const PageLayout = (props: PropsWithChildren) => {
  return <>
    <main className="flex h-screen justify-center">
      <div className="w-full h-full border-x border-slate-400 md:max-w-3xl">
        {props.children}
      </div>
    </main>
  </>
}
export default PageLayout;
