import Scale from "./components/Scale";
import Upload from "./components/Upload";
import File from "./components/File";
import Result from "./components/Result";

export default function Home() {
  return (
    <div className=" p-8 items-left justify-items-left min-h-screen font-[family-name:var(--font-geist-sans)]">
      <div className="flex flex-row justify-between gap-4 w-full">  
        <h1 className="text-4xl font-bold mb-4 w-1/2">ISP Platform</h1>
        {/* Setup */}
        <div className="flex flex-row justify-center items-stretch gap-4 w-full">
          <div className="w-full h-15">
            <Scale />
          </div>
          <div className="w-full h-15">
            <Upload />
          </div>
          <div className="w-full h-15">
            <File />
          </div>
        </div>
      </div>
      <hr className="my-4 border-1 border-gray-300" />
      {/* Results */}
      <Result />

      {/* Footer */}
      <footer className="row-start-3 flex flex-wrap items-center justify-center text-sm">
       Updated July 11, 2025
      </footer>
    </div>
  );
}
