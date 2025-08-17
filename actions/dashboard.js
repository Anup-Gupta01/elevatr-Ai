// "use server";

// import { db } from "@/lib/prisma";
// import { auth } from "@clerk/nextjs/server";
// import { GoogleGenerativeAI } from "@google/generative-ai";
// import { includes } from "zod";


// const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
// const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// export const generateAIInsights = async (industry) => {

//   const prompt = `
//           Analyze the current state of the ${industry} industry and provide insights in ONLY the following JSON format without any additional notes or explanations:
//           {
//             "salaryRanges": [
//               { "role": "string", "min": number, "max": number, "median": number, "location": "string" }
//             ],
//             "growthRate": number,
//             "demandLevel": "HIGH" | "MEDIUM" | "LOW",
//             "topSkills": ["skill1", "skill2"],
//             "marketOutlook": "POSITIVE" | "NEUTRAL" | "NEGATIVE",
//             "keyTrends": ["trend1", "trend2"],
//             "recommendedSkills": ["skill1", "skill2"]
//           }
          
//           IMPORTANT: Return ONLY the JSON. No additional text, notes, or markdown formatting.
//           Include at least 5 common roles for salary ranges.
//           Growth rate should be a percentage.
//           Include at least 5 skills and trends.
//         `;

//   const result = await model.generateContent(prompt);
//   const response = result.response;
//   const text = response.text();
//   const cleanedText = text.replace(/```(?:json)?\n?/g, "").trim();

//   return JSON.parse(cleanedText);
// };


// export async function getIndustryInsights() {
//   const { userId } = await auth();
//   if (!userId) throw new Error("Unauthorized");

//   const user = await db.user.findUnique({
//     where: { clerkUserId: userId },
//     include:{
//       IndustryInsight:true,
//     },
//   });

//   if (!user) throw new Error("User not found");
//   if (!user.IndustryInsight) {
//     const insights = await generateAIInsights(user.industry);
//     const industryInsight =await db.industryInsight.create({
//       data:{
//         industry:user.industry,
//         ...insights,
//         nextUpdate:new Date(Date.now() + 7*24*60*60*1000),
//       },
//     });
//     return industryInsight;
//   }

//   return user.IndustryInsight;

// }

"use server";

import { db } from "@/lib/prisma";
import { auth, currentUser } from "@clerk/nextjs/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export const generateAIInsights = async (industry) => {
  const prompt = `
    Analyze the current state of the ${industry} industry and provide insights in ONLY the following JSON format without any additional notes or explanations:
    {
      "salaryRanges": [
        { "role": "string", "min": number, "max": number, "median": number, "location": "string" }
      ],
      "growthRate": number,
      "demandLevel": "HIGH" | "MEDIUM" | "LOW",
      "topSkills": ["skill1", "skill2"],
      "marketOutlook": "POSITIVE" | "NEUTRAL" | "NEGATIVE",
      "keyTrends": ["trend1", "trend2"],
      "recommendedSkills": ["skill1", "skill2"]
    }
    
    IMPORTANT: Return ONLY the JSON. No additional text, notes, or markdown formatting.
    Include at least 5 common roles for salary ranges.
    Growth rate should be a percentage.
    Include at least 5 skills and trends.
  `;

  const result = await model.generateContent(prompt);
  const response = result.response;
  const text = response.text();
  const cleanedText = text.replace(/```(?:json)?\n?/g, "").trim();

  return JSON.parse(cleanedText);
};

export async function getIndustryInsights() {
  const { userId } = await auth();
  if (!userId) {
    return { error: "Unauthorized. Please sign in." };
  }

  // Try to fetch user from DB
  let user = await db.user.findUnique({
    where: { clerkUserId: userId },
    include: { industryInsight: true }, 
  });  

  // If user not found in DB → create them automatically
  if (!user) {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return { error: "User not found in Clerk. Please re-login." };
    }

    user = await db.user.create({
      data: {
        clerkUserId: clerkUser.id,
        email: clerkUser.emailAddresses[0].emailAddress,
        industry: "general", // <-- default, you can update later from UI
      },
      include: { IndustryInsight: true },
    });
  }

  // If no IndustryInsight yet → generate and save
  if (!user.IndustryInsight) {
    const insights = await generateAIInsights(user.industry || "general");

    const industryInsight = await db.industryInsight.create({
      data: {
        industry: user.industry || "general",
        ...insights,
        nextUpdate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        userId: user.id, // link to user
      },
    });

    return industryInsight;
  }

  return user.IndustryInsight;
}
