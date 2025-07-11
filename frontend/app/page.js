import Scale from "./components/Scale";
import Upload from "./components/Upload";
import File from "./components/File";
import Result from "./components/Result";

export default function Home() {
  return (
    <div className=" p-8 items-center justify-items-center min-h-screen font-[family-name:var(--font-geist-sans)]">
      <h1 className="text-4xl font-bold mb-4">ISP Platform</h1>
      {/* Body */}
      <div className="flex flex-col items-center gap-4  border-2 border-black rounded-md p-5 w-full h-full">
        <div className="grid grid-cols-3 items-stretch gap-4 w-1/2">
          <div className="w-full h-28">
            <Scale />
          </div>
          <div className="w-full h-28">
            <Upload />
          </div>
          <div className="w-full h-28">
            <File />
          </div>
        </div>
        <Result />
      </div>
      <footer className="row-start-3 flex gap-[24px] flex-wrap items-center justify-center">
       Updated July 7, 2025
      </footer>
    </div>
  );
}
