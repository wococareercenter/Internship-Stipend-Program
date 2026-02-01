"use client";
import { useState } from "react";
import Scale from "./components/Scale";
import Result from "./components/Result";
import { Dialog, DialogTrigger, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Toaster } from "@/components/ui/sonner";

export default function Home() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState(2026);

  return (
    <div className=" p-8 items-left justify-items-left min-h-screen font-[family-name:var(--font-geist-sans)]">
      <div className="flex flex-row justify-between gap-4 w-full">  
        <h1 className="text-4xl font-bold mb-4 w-1/2">ISP Platform</h1>
        {/* Setup */}
        <div className="flex flex-row gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="border-2 border-black rounded-md p-3 h-full flex-shrink-0 hover:bg-gray-50 hover:cursor-pointer">
                <h2 className="text-xl font-bold">{selectedYear}</h2>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setSelectedYear(2026)}>2026</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSelectedYear(2025)}>2025</DropdownMenuItem>
            </DropdownMenuContent>
            </DropdownMenu>
         
          <div className="border-2 border-black rounded-md p-3 h-full flex-shrink-0 hover:bg-gray-50">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <button className="hover:cursor-pointer" type="button">
                  <div className="flex flex-row items-center gap-1 justify-center">
                    <h2 className="text-xl font-bold">Set Your Scale</h2>
                  </div>
                </button>
              </DialogTrigger>
              <DialogContent className="!max-w-[80vw] !max-h-[95vh]">
                <DialogTitle className="text-xl font-bold">Set Your Scale</DialogTitle>
                <DialogDescription className="text-sm">You can adjust the points for FAFSA, paid/unpaid, internship type. You can also drag and drop states between cost of living tiers to organize them.</DialogDescription>
                <Scale onSave={() => setIsDialogOpen(false)} />
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
      <hr className="my-4 border-1 border-gray-300" />
      {/* Results */}
      <Result year={selectedYear} />

      {/* Footer */}
      <footer className="row-start-3 flex flex-wrap items-center justify-center text-sm">
       Updated February 1, 2026
      </footer>
      <Toaster 
        position="bottom-right"
        className="rounded-md"
        style={{
          color: "white",
        }}
      />
    </div>
  )
}
