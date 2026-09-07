// AI service using Groq for generating job descriptions and recommendations
import Groq from 'groq-sdk';

const getGroqClient = () => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error('GROQ_API_KEY environment variable is not set');
  }
  return new Groq({ apiKey });
};

export const generateJobDescription = async (jobDetails) => {
  try {
    const groq = getGroqClient();
    const { title, category, skills = [], experience = {}, workMode = 'onsite' } = jobDetails;

    const prompt = `
Generate a professional job description in HTML format for the following position:

Job Title: ${title}
Category: ${category}
Required Skills: ${skills.join(', ')}
Experience Required: ${experience.min || 0} to ${experience.max || 5} years
Work Mode: ${workMode}

The description should include sections for:
- About the Role
- Key Responsibilities
- Required Skills
- Experience Requirements
- What We Offer

Make it engaging and professional. Return only the inner HTML content (without <html>, <body>, or <head> tags) that can be directly inserted into a content editable div.
`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.1-8b-instant',
      temperature: 0.7,
      max_tokens: 1000,
    });

    const description = chatCompletion.choices[0]?.message?.content?.trim();
    if (!description) {
      throw new Error('No response from Groq API');
    }

    // Extract content from HTML tags if present and remove markdown code blocks
    let cleanedDescription = description;
    
    // Remove markdown code blocks if present
    if (cleanedDescription.startsWith('```html') && cleanedDescription.endsWith('```')) {
      cleanedDescription = cleanedDescription.slice(7, -3).trim();
    } else if (cleanedDescription.startsWith('```') && cleanedDescription.endsWith('```')) {
      cleanedDescription = cleanedDescription.slice(3, -3).trim();
    }
    
    // Extract content from HTML tags if present
    if (cleanedDescription.includes('<html>') || cleanedDescription.includes('<body>')) {
      // Try to extract the content inside the body or main div
      const bodyMatch = cleanedDescription.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
      if (bodyMatch) {
        cleanedDescription = bodyMatch[1].trim();
      } else {
        // Fallback: remove html and body tags
        cleanedDescription = cleanedDescription.replace(/<\/?html[^>]*>/gi, '').replace(/<\/?body[^>]*>/gi, '').trim();
      }
    }

    return cleanedDescription;
  } catch (error) {
    console.error('Error generating job description:', error);
    throw new Error('Failed to generate job description');
  }
};

export const generateJobRecommendations = async (userProfile, jobs) => {
  try {
    const groq = getGroqClient();
    const { skills = [], experience = 0, location, jobPreferences = {} } = userProfile;

    // First, filter jobs based on basic criteria
    const filteredJobs = jobs.filter(job => {
      const skillMatch = job.skills?.some(skill => skills.includes(skill)) || false;
      const experienceMatch = job.experience <= experience + 2;
      const locationMatch = !location || !job.location || job.location.toLowerCase().includes(location.toLowerCase());
      return skillMatch && experienceMatch && locationMatch;
    });

    if (filteredJobs.length === 0) {
      return [];
    }

    // Use AI to score and rank the filtered jobs
    const jobsText = filteredJobs.map((job, index) => `
Job ${index + 1}:
Title: ${job.title}
Category: ${job.category}
Skills: ${job.skills?.join(', ') || 'Not specified'}
Experience: ${job.experience} years
Location: ${job.location || 'Not specified'}
Description: ${job.description?.substring(0, 200) || 'Not available'}
`).join('\n');

    const prompt = `
User Profile:
Skills: ${skills.join(', ')}
Experience: ${experience} years
Location: ${location || 'Not specified'}
Job Preferences: ${JSON.stringify(jobPreferences)}

Available Jobs:
${jobsText}

Rank these jobs from most to least suitable for the user based on skill match, experience level, and preferences. Return only a JSON array of job indices (1-based) in order of suitability, limited to top 5. Example: [1, 3, 2, 4, 5]
`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.1-8b-instant',
      temperature: 0.3,
      max_tokens: 100,
    });

    const response = chatCompletion.choices[0]?.message?.content?.trim();
    let rankedIndices;
    try {
      rankedIndices = JSON.parse(response);
    } catch (e) {
      // Fallback to original order if parsing fails
      rankedIndices = filteredJobs.map((_, i) => i + 1);
    }

    const recommendations = rankedIndices.slice(0, 5).map(index => filteredJobs[index - 1]).filter(Boolean);
    return recommendations;
  } catch (error) {
    console.error('Error generating job recommendations:', error);
    throw new Error('Failed to generate job recommendations');
  }
};

export const matchCandidates = async (job, applicants) => {
  try {
    const groq = getGroqClient();
    const { skills: jobSkills = [], experience: jobExp = 0, title, category } = job;

    const applicantsText = applicants.map((applicant, index) => `
Applicant ${index + 1}:
Name: ${applicant.userProfile?.name || 'Unknown'}
Skills: ${applicant.userProfile?.skills?.join(', ') || 'Not specified'}
Experience: ${applicant.userProfile?.yearsOfExperience || 0} years
Location: ${applicant.userProfile?.location || 'Not specified'}
`).join('\n');

    const prompt = `
Job Details:
Title: ${title}
Category: ${category}
Required Skills: ${jobSkills.join(', ')}
Required Experience: ${jobExp} years

Applicants:
${applicantsText}

Rank these applicants from best to worst match for the job based on skill relevance, experience level, and overall fit. Return only a JSON array of applicant indices (1-based) in order of match quality, limited to top 10. Include a match score (0-1) for each. Example: [{"index": 1, "score": 0.95}, {"index": 3, "score": 0.87}, ...]
`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.1-8b-instant',
      temperature: 0.3,
      max_tokens: 300,
    });

    const response = chatCompletion.choices[0]?.message?.content?.trim();
    let rankedApplicants;
    try {
      rankedApplicants = JSON.parse(response);
    } catch (e) {
      // Fallback to simple scoring
      rankedApplicants = applicants.map((_, i) => ({ index: i + 1, score: Math.random() }));
    }

    const matches = rankedApplicants.slice(0, 10).map(item => {
      const applicant = applicants[item.index - 1];
      return { ...applicant.toObject(), matchScore: item.score };
    });

    return matches;
  } catch (error) {
    console.error('Error matching candidates:', error);
    throw new Error('Failed to match candidates');
  }
};

export const analyzeSkillGaps = async (userProfile, targetJob) => {
  try {
    const groq = getGroqClient();
    const userSkills = userProfile.skills || [];
    const jobSkills = targetJob.skills || [];
    const userExp = userProfile.yearsOfExperience || 0;
    const jobExp = targetJob.experience || 0;

    const prompt = `
User Profile:
Skills: ${userSkills.join(', ')}
Experience: ${userExp} years

Target Job:
Required Skills: ${jobSkills.join(', ')}
Required Experience: ${jobExp} years

Analyze the skill gaps between the user's profile and the target job. Identify:
1. Missing skills that the user needs to acquire
2. Experience gap in years
3. Specific recommendations for bridging these gaps

Return the analysis in JSON format:
{
  "missingSkills": ["skill1", "skill2"],
  "experienceGap": 2,
  "recommendations": ["Recommendation 1", "Recommendation 2"]
}
`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.1-8b-instant',
      temperature: 0.5,
      max_tokens: 500,
    });

    const response = chatCompletion.choices[0]?.message?.content?.trim();
    let analysis;
    try {
      analysis = JSON.parse(response);
    } catch (e) {
      // Fallback to basic analysis
      const missingSkills = jobSkills.filter(skill => !userSkills.includes(skill));
      const expGap = Math.max(0, jobExp - userExp);
      analysis = {
        missingSkills,
        experienceGap: expGap,
        recommendations: missingSkills.map(skill => `Learn ${skill} through online courses or projects`)
      };
    }

    return analysis;
  } catch (error) {
    console.error('Error analyzing skill gaps:', error);
    throw new Error('Failed to analyze skill gaps');
  }
};

export default {
  generateJobDescription,
  generateJobRecommendations,
  matchCandidates,
  analyzeSkillGaps
};