import {serve} from "inngest/next";
import {inngest} from "@/lib/inngest/client";
import { generateIndustryInsights, helloWorld } from "@/lib/inngest/functions";

//create an api thtat servesmzero functions
export const {GET,POST} =serve({
    client:inngest,
    functions:[
        // your function will be passed here later
        // helloWorld,
        generateIndustryInsights,
    ],
});