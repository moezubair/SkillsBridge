import { Router, type IRouter } from "express";
import { AnalyzeProfileBody } from "@workspace/api-zod";
import { openai } from "@workspace/integrations-openai-ai-server";

const router: IRouter = Router();

router.post("/programs/analyze", async (req, res) => {
  try {
    const body = AnalyzeProfileBody.parse(req.body);
    const { resumeText, linkedinData, profession, country } = body;

    const profileContext = [
      resumeText ? `RESUME:\n${resumeText}` : "",
      linkedinData ? `LINKEDIN PROFILE:\n${linkedinData}` : "",
    ]
      .filter(Boolean)
      .join("\n\n");

    const hasProfile = profileContext.trim().length > 0;

    const systemPrompt = `You are an expert academic advisor specializing in university admissions worldwide. 
Your task is to analyze a user's academic and professional profile and match them with appropriate university programs.

You have deep knowledge of:
- Admission requirements for universities worldwide (GPA requirements, standardized tests like GRE/GMAT/TOEFL/IELTS, prerequisite courses)
- Program rankings, durations, and typical tuition ranges
- What makes a candidate competitive for different types of programs

Be realistic but encouraging. Always return actual, well-known universities and programs.
Return JSON only, no markdown, no extra text.`;

    const countryContext = country ? ` The user prefers studying in ${country}.` : " Include programs from top universities worldwide (US, UK, Canada, Australia, Europe).";

    const userPrompt = hasProfile
      ? `Analyze this profile and find matching programs for the target field: ${profession}.${countryContext}

${profileContext}

Return a JSON object with this exact structure:
{
  "userProfile": {
    "extractedGpa": "string or null - GPA if found in profile",
    "extractedDegree": "string or null - highest degree e.g. Bachelor's in Computer Science",
    "extractedField": "string or null - field of study",
    "extractedSkills": ["array of key skills"],
    "extractedExperience": "string or null - years/level of experience",
    "extractedCourses": ["array of relevant courses mentioned"]
  },
  "summary": "2-3 sentence summary of the profile and what programs were found",
  "eligiblePrograms": [
    {
      "university": "University Name",
      "country": "Country",
      "program": "Program Name",
      "degree": "Master's/PhD/Bachelor's",
      "duration": "2 years",
      "tuitionRange": "$20,000 - $40,000/year",
      "ranking": "#1-50 globally / Top 10 in field",
      "admissionRequirements": ["Requirement 1", "Requirement 2"],
      "whyEligible": "Explanation of why the user qualifies",
      "applicationDeadline": "December 15 / Rolling",
      "programUrl": "approximate URL like https://cs.stanford.edu/academics/masters"
    }
  ],
  "nearMatchPrograms": [
    {
      "university": "University Name",
      "country": "Country",
      "program": "Program Name",
      "degree": "Master's/PhD/Bachelor's",
      "duration": "2 years",
      "tuitionRange": "$20,000 - $40,000/year",
      "ranking": "Top 20 globally",
      "matchScore": 75,
      "applicationDeadline": "January 15",
      "programUrl": "approximate URL",
      "gaps": [
        {
          "type": "gpa|test_score|course|experience|language|other",
          "description": "What is missing or insufficient",
          "howToFix": "Specific actionable steps",
          "timeToFix": "3-6 months"
        }
      ]
    }
  ]
}

Find 4-6 eligible programs and 4-6 near-match programs. Be specific with real universities and real programs. Consider the user's background carefully when assessing eligibility.`
      : `The user has not provided a resume or LinkedIn profile. They are looking for ${profession} programs.${countryContext}

Since no profile was provided, create a generic profile for a typical applicant and find programs.

Return a JSON object with this exact structure:
{
  "userProfile": {
    "extractedGpa": null,
    "extractedDegree": null,
    "extractedField": null,
    "extractedSkills": [],
    "extractedExperience": null,
    "extractedCourses": []
  },
  "summary": "No profile was provided. Showing top ${profession} programs. Upload your resume for personalized matching.",
  "eligiblePrograms": [
    {
      "university": "University Name",
      "country": "Country",
      "program": "Program Name",
      "degree": "Master's/PhD/Bachelor's",
      "duration": "2 years",
      "tuitionRange": "$20,000 - $40,000/year",
      "ranking": "Top 50 globally",
      "admissionRequirements": ["Typical requirement 1", "Typical requirement 2"],
      "whyEligible": "These are top programs in the field",
      "applicationDeadline": "December 15",
      "programUrl": "approximate URL"
    }
  ],
  "nearMatchPrograms": []
}

Return 6 top programs for ${profession}.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-5.2",
      max_completion_tokens: 8192,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      res.status(500).json({ error: "ai_error", message: "No response from AI" });
      return;
    }

    const parsed = JSON.parse(content);

    res.json({
      userProfile: parsed.userProfile || {
        extractedGpa: null,
        extractedDegree: null,
        extractedField: null,
        extractedSkills: [],
        extractedExperience: null,
        extractedCourses: [],
      },
      eligiblePrograms: parsed.eligiblePrograms || [],
      nearMatchPrograms: parsed.nearMatchPrograms || [],
      summary: parsed.summary || "Analysis complete.",
    });
  } catch (err) {
    req.log.error({ err }, "Error analyzing profile");
    res.status(500).json({
      error: "internal_error",
      message: "Failed to analyze profile. Please try again.",
    });
  }
});

export default router;
