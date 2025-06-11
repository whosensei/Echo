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
        Description: "Generate captivating Posts with a single click",
        icon: PlusIcon,
        url:""

    },
    
    
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4 gap-x-5">
      {QuickActions.map((quickaction) => (
        <div className="flex items-center bg-white rounded-xl hover:shadow-md border border-gray-200 hover:border-gray-300 w-100 p-5 hover:cursor-pointer"
        onClick={()=>router.push(quickaction.url)}>
          <div className="flex" key={quickaction.Type}>
            <div className="pr-4 pt-4 items-center justify-center">
              <quickaction.icon className="flex w-8 h-8 text-white bg-blue-600 rounded-full" />
            </div>
            <div className="flex flex-col">
              <div className="font-semibold">{quickaction.Type}</div>
              <div className="text-gray-400 pr-2">{quickaction.Description}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
