// "use client"

// import React from "react"
// import { Sparkles, Zap, Palette, Target, Clock, Shield } from "lucide-react"

// export function FeaturesSection() {
//   const features = [
//     {
//       icon: Sparkles,
//       title: "AI-Powered Creation",
//       description: "Our advanced AI analyzes trends and generates compelling ad copy that resonates with your target audience.",
//       gradient: "from-blue-500 to-cyan-500",
//       image: "🎨",
//     },
//     {
//       icon: Zap,
//       title: "Lightning Fast",
//       description: "Generate professional advertisements in seconds, not hours. Perfect for rapid campaign deployment.",
//       gradient: "from-purple-500 to-blue-500", 
//       image: "⚡",
//     },
//     {
//       icon: Palette,
//       title: "Brand Consistency",
//       description: "Maintain your brand identity across all platforms with customizable templates and color schemes.",
//       gradient: "from-pink-500 to-purple-500",
//       image: "🎯",
//     },
//     {
//       icon: Target,
//       title: "Multi-Platform Optimization",
//       description: "Automatically optimize your ads for Instagram, Facebook, LinkedIn, and X with platform-specific formats.",
//       gradient: "from-green-500 to-blue-500",
//       image: "📱",
//     },
//   ]

//   return (
//     <div className="py-24 px-6">
//       <div className="text-center mb-16">
//         <h2 className="text-4xl md:text-5xl font-bold mb-6">
//           <span className="text-gradient-hero">Powerful Features</span>{" "}
//           <span className="text-foreground">for Modern Marketing</span>
//         </h2>
//         <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
//           Everything you need to create stunning advertisements that drive results
//         </p>
//       </div>

//       <div className="space-y-24">
//         {features.map((feature, index) => {
//           const Icon = feature.icon
//           const isEven = index % 2 === 0
          
//           return (
//             <div 
//               key={feature.title}
//               className={`flex flex-col lg:flex-row items-center gap-12 lg:gap-16 ${
//                 isEven ? 'lg:flex-row' : 'lg:flex-row-reverse'
//               }`}
//             >
//               {/* Image/Visual side */}
//               <div className="flex-1 relative">
//                 <div className="relative glass-enhanced rounded-2xl p-8 lg:p-12 text-center overflow-hidden">
//                   {/* Background gradient */}
//                   <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-5 rounded-2xl`}></div>
                  
//                   {/* Large emoji/icon display */}
//                   <div className="relative text-8xl lg:text-9xl mb-4 filter drop-shadow-lg">
//                     {feature.image}
//                   </div>
                  
//                   {/* Floating elements */}
//                   <div className="absolute top-4 right-4 w-3 h-3 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full opacity-60 animate-pulse"></div>
//                   <div className="absolute bottom-6 left-6 w-2 h-2 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full opacity-60 animate-pulse" style={{animationDelay: '1s'}}></div>
//                 </div>
//               </div>

//               {/* Content side */}
//               <div className="flex-1 space-y-6">
//                 <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full glass-enhanced">
//                   <div className={`p-2 rounded-lg bg-gradient-to-br ${feature.gradient} text-white`}>
//                     <Icon className="w-5 h-5" />
//                   </div>
//                   <span className="text-sm font-medium text-muted-foreground">Feature</span>
//                 </div>
                
//                 <h3 className="text-3xl lg:text-4xl font-bold text-foreground">
//                   {feature.title}
//                 </h3>
                
//                 <p className="text-lg text-muted-foreground leading-relaxed">
//                   {feature.description}
//                 </p>
                
//                 <div className="flex items-center gap-4 pt-4">
//                   <div className="flex -space-x-2">
//                     {[1, 2, 3].map((i) => (
//                       <div 
//                         key={i}
//                         className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 border-2 border-background"
//                       ></div>
//                     ))}
//                   </div>
//                   <span className="text-sm text-muted-foreground">Used by 10K+ creators</span>
//                 </div>
//               </div>
//             </div>
//           )
//         })}
//       </div>
//     </div>
//   )
// } 