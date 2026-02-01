import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const apiKey = process.env.GOOGLE_API_KEY;

if (!apiKey) {
    console.error("GOOGLE_API_KEY is missing from .env");
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

async function testConnectivity() {
    console.log("Testing Gemini Connectivity...");

    // Test 1: Simple generation with gemini-2.0-flash
    console.log("\nTest 1: Simple generation with gemini-2.0-flash...");
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        const result = await model.generateContent("Say 'Gemini 2.0 works!'");
        console.log("Response:", result.response.text());
    } catch (error) {
        console.error("Gemini 2.0 Error:", error instanceof Error ? error.message : error);
    }

    // Test 2: Simple generation with gemini-flash-latest
    console.log("\nTest 2: Simple generation with gemini-flash-latest...");
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
        const result = await model.generateContent("Say 'Gemini Flash Latest works!'");
        console.log("Response:", result.response.text());
    } catch (error) {
        console.error("Gemini Flash Latest Error:", error instanceof Error ? error.message : error);
    }

    // Test 2.5: Simple generation with gemini-pro-latest
    console.log("\nTest 2.5: Simple generation with gemini-pro-latest...");
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-pro-latest" });
        const result = await model.generateContent("Say 'Gemini Pro Latest works!'");
        console.log("Response:", result.response.text());
    } catch (error) {
        console.error("Gemini Pro Latest Error:", error instanceof Error ? error.message : error);
    }

    // Test 3: List models
    console.log("\nTest 3: Listing available models...");
    try {
        // The REST API for listing models
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const data = await response.json();
        if (data.models) {
            console.log("Available models:");
            data.models.forEach((m: any) => {
                console.log(`- ${m.name} (${m.supportedGenerationMethods.join(", ")})`);
            });
        } else {
            console.log("No models returned or error:", data);
        }
    } catch (error) {
        console.error("Listing Models Error:", error instanceof Error ? error.message : error);
    }
}

testConnectivity();
