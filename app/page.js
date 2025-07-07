import Scale from "./components/Scale";

export default function Home() {
  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <h1 className="text-4xl font-bold">ISP Platform</h1>
      {/* Body */}
      <div className="flex flex-col items-start gap-4 border-2 border-black rounded-md p-5 w-full h-full">
        <Scale />
      </div>
      <footer className="row-start-3 flex gap-[24px] flex-wrap items-center justify-center">
       Updated July 7, 2025
      </footer>
    </div>
  );
}
