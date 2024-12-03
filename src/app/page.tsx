"use client"
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useSession } from 'next-auth/react';
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const {data: session, status} = useSession();
  useEffect(() => {
    if(status !== 'authenticated') {
      router.push("api/auth/signin")
    }
  }, [])
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const [image, setImage] = useState<File | null>(null);

  const [userImages, setUserImages] = useState([]);

  const { toast } = useToast();

  const openModal = ({ url, key }: {url: string, key: string}) => {
    setSelectedImage(url)
    setSelectedKey(key)
  }

  const closeModal = () => {
    setSelectedImage(null);
  }

  const uploadImage = async () => {
    const data = new FormData();
    if(image) {
      data.append("image", image);
    } else {
      return;
    }

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: data
      });

      if(response.ok) {
        toast({
          title: "Uploaded Successfully!",
          description: "Your image was uploaded successfully. This page will reload automatically."
        })
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        toast({
          title: "Oops! Something went wrong.",
          description: "There was a problem uploading your image. Please try again.",
          variant: "destructive"
        });
      }
    } catch(error) {
      console.error('There was a problem making the api call to /api/upload: ', error);
    }
  }

  const fetchImages = async () => {
    try {
      const response = await fetch('/api/images', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if(response.ok) {
        const json = await response.json();
        setUserImages(json)
      }
    } catch(error) {
      console.error("Error encountered while fetching images: ", error);
    }
  }

  const deleteImage = async () => {
    try {
      const response = await fetch('/api/delete', {
        method: 'DELETE',
        body: JSON.stringify({key: selectedKey})
      });

      if(response.ok) {
        toast({
          title: "Deleted!",
          description: "Your image was deleted successfully",
          variant: 'destructive'
        });
        setUserImages((userImages: any) => {
          return userImages.filter((image: any) => image?.key !== selectedKey)
        })
        setSelectedKey(null);
        closeModal();
      }
    } catch(error) {
      console.error("There was a problem deleting the image")
      toast({
        title: "Oops! Something went wrong.",
        description: "There was a problem deleting that image."
      });
    }
  }

  useEffect(() => {
    fetchImages();
  }, []);

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-8 items-start sm:items-start mt-10">
        <div className = "grid grid-cols-10 gap-2 mt-[100px]">
          {
            userImages.map((image: any, key) => {
              return (
                <Image key={key} src={image.url} height = {200} width={200} alt = "sample" onClick={() => {
                  openModal(image)
                }} />
              )
            })
          }
        </div>
        <AlertDialog>
          <AlertDialogTrigger className = "place-self-center" asChild>
            <Button>Upload</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Select an image to upload</AlertDialogTitle>
            </AlertDialogHeader>
            <AlertDialogDescription>
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label htmlFor="picture">Picture</Label>
              <Input id="picture" type="file" onChange = {(event: React.ChangeEvent<HTMLInputElement>) => {
                const file = event.target.files?.[0];
                if(file) {
                  setImage(file)
                }
              }} />
            </div>
            </AlertDialogDescription>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={uploadImage}>Continue</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        {
          selectedImage && 
          <div
            className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
            onClick={closeModal}
          >
            <div
              className="relative bg-transparent animate-scaleIn"
              onClick={(e) => e.stopPropagation()} // Prevents closing when clicking inside the modal
            >
              {/* Close Button */}
              <button
                onClick={() => {
                  deleteImage();
                }}
                className="absolute top-2 left-2 text-black rounded-full py-1 px-3 hover:bg-red-400 shadow-lg transition"
              >
                <Trash2 />
              </button>
              <button
                onClick={closeModal}
                className="absolute top-2 right-2 text-black rounded-full py-1 px-3 hover:bg-gray-200 shadow-lg transition"
              >
                ✖
              </button>

              {/* Enlarged Image */}
              <div className="flex items-center justify-center">
                <Image
                  src={selectedImage!} // Image to display
                  alt="Enlarged"
                  width={400}
                  height={400}
                  className="h-auto max-w-full max-h-[90vh] rounded-lg"
                />
              </div>
            </div>
          </div>
        }
      </main>
      <footer className="row-start-3 flex gap-6 flex-wrap items-center justify-center">
        Created by Kumar Piyush
      </footer>
    </div>
  );
}
