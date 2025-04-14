[1mdiff --git a/frontend/src/app/chat/[id]/page.jsx b/frontend/src/app/chat/[id]/page.jsx[m
[1mindex f6fbbf2..bf8b120 100644[m
[1m--- a/frontend/src/app/chat/[id]/page.jsx[m
[1m+++ b/frontend/src/app/chat/[id]/page.jsx[m
[36m@@ -238,7 +238,7 @@[m [mexport default function ChatPage() {[m
         <header className="page-header">[m
           <div className="container mx-auto flex items-center justify-between">[m
             <div className="flex items-center">[m
[31m-              <button onClick={() => router.back()} className="btn btn-icon p-2 rounded-full hover:bg-gray-200">[m
[32m+[m[32m              <button id="back-button" onClick={() => router.back()} className="btn btn-icon p-2 rounded-full hover:bg-gray-200">[m
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">[m
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />[m
                 </svg>[m
