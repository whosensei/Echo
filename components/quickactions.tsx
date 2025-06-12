"use client"
import { Icon, Plus, PlusIcon } from "lucide-react";
import { useRouter } from "next/navigation";

export function QuickActions() {
    const router = useRouter()
  const QuickActions = [
    {
      Type: "Portraits",
      Description: "Generate multiple elegant portraits with a single click",
      icon: PlusIcon,
      url:""
    },
    {
      Type: "Headshots",
      Description: "Generate multiple elegant Headshots with a single click",
      icon: PlusIcon,
      url:""
    },
    {
        Type: "Hairstyle",
        Description: "Generate multiple elegant Hairstyle looks with a single click",
        icon: PlusIcon,
        url:""

    },
    {
        Type: "ADs",
        Description: "Generate stunning ADs looks with a single click",
        icon: PlusIcon,
        url:""

    },
    {
        Type: "Social Media Post",
        Description: "Generate captivating Posts for social media with a single click",
        icon: PlusIcon,
        url:""

    },
    
    
  ];

  return (
    <div className="grid grid-cols-1 min-w-0 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
      {QuickActions.map((quickaction) => (
        <div className="flex items-center bg-white rounded-xl hover:shadow-md border border-gray-200 hover:border-gray-300 p-4 hover:cursor-pointer transition-all duration-200 min-w-0"
        onClick={()=>router.push(quickaction.url)}
        key={quickaction.Type}>
          <div className="flex w-full min-w-0 overflow-hidden">
            <div className="flex pr-3 items-center justify-center flex-shrink-0">
              <quickaction.icon className="w-8 h-8 text-white bg-blue-600 rounded-full p-1" />
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <div className="font-semibold text-sm lg:text-base truncate font-inter">{quickaction.Type}</div>
              <div className="text-gray-400 text-xs lg:text-sm leading-tight line-clamp-2  font-inter pr-2">{quickaction.Description}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
