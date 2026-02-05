import geminiService from './services/geminiService.js';

const generateSamples = async () => {
    console.log('Generating samples from AI... Please wait...\n');

    // 1. Generate Normal Weekday Sample (using today/Thursday)
    console.log('--- SAMPLE 1: Normal Weekday (Thursday) ---');
    const weekdayMsg = await geminiService.generateMorningGreeting();
    console.log(weekdayMsg);
    console.log('\n-----------------------------------------\n');

    // 2. Generate Sunday Sample (Simulating Sunday)
    console.log('--- SAMPLE 2: Sunday Special ---');
    // Create a date object for next Sunday
    const sundayDate = new Date();
    sundayDate.setDate(sundayDate.getDate() + (7 - sundayDate.getDay()) % 7);
    if (sundayDate.getDay() !== 0) sundayDate.setDate(sundayDate.getDate() + (0 - sundayDate.getDay() + 7) % 7); // Ensure it's Sunday

    const sundayMsg = await geminiService.generateMorningGreeting(sundayDate);
    console.log(sundayMsg);
    console.log('\n-----------------------------------------');
};

generateSamples();
