// import { getUserOnboardingStatus } from '@/actions/user';
// import { industries } from '@/app/data/industries';
// import { redirect } from 'next/dist/server/api-utils';
// import OnboardingForm from "./_components/onboarding-form";
// import React from 'react'

// const OnboardingPage =async () => {

// //checck if user is already onboarded
// const {isOnboarded} =await getUserOnboardingStatus();
// if(isOnboarded){
//   redirect("/dashboard");
// }

//   return <main>
//     <OnboardingForm industries={industries || []} />
//   </main>;

// }

// export default OnboardingPage
import { redirect } from "next/navigation";
import { industries } from "@/app/data/industries";
import OnboardingForm from "./_components/onboarding-form";
import { getUserOnboardingStatus } from "@/actions/user";

export default async function OnboardingPage() {
  // Check if user is already onboarded
  const { isOnboarded } = await getUserOnboardingStatus();

  if (isOnboarded) {
    redirect("/dashboard");
  }
  // console.log("Industries data in OnboardingPage:", industries);

  return (
    <main>
      <OnboardingForm industries={industries} />
    </main>
  );
}