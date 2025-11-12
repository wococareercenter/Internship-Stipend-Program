"use client";
import { useState } from "react";
import Scale from "./components/Scale";
import Upload from "./components/Upload";
import File from "./components/File";
import Result from "./components/Result";
import { Dialog, DialogTrigger, DialogContent } from "@/components/ui/dialog";

export default function Home() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <div className=" p-8 items-left justify-items-left min-h-screen font-[family-name:var(--font-geist-sans)]">
      <div className="flex flex-row justify-between gap-4 w-full">  
        <h1 className="text-4xl font-bold mb-4 w-1/2">ISP Platform</h1>
        {/* Setup */}
        <div className="flex flex-row justify-center items-stretch gap-4 w-full">
          <div className="border-2 border-black rounded-md p-3 h-full flex-shrink-0 hover:bg-gray-50">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <button className="hover:cursor-pointer" type="button">
                  <div className="flex flex-row items-center gap-2 justify-center">
                    <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <h2 className="text-xl font-bold">Set Your Scale</h2>
                  </div>
                </button>
              </DialogTrigger>
              <DialogContent className="!max-w-[80vw] !max-h-[90vh] !p-0 overflow-y-auto">
                <Scale onSave={() => setIsDialogOpen(false)} />
              </DialogContent>
            </Dialog>
          </div>
          <div className="w-full h-15">
           
          </div>
          <div className="w-full h-15">
            <Upload />
          </div>
          {/* <div className="w-full h-15">
            <File />
          </div> */}
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
