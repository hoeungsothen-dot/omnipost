const Anthropic = require('@anthropic-ai/sdk');
const logger = require('../utils/logger');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const PLATFORM_STYLES = {
  facebook: {
    maxLength: 500,
    style: 'conversational, engaging, includes a call-to-action. Use 1-2 relevant emojis.',
  },
  instagram: {
    maxLength: 300,
    style: 'visual and emotive, followed by a blank line, then 20-30 relevant hashtags on the next line.',
  },
  youtube: {
    maxLength: 1000,
    style: 'detailed description with keywords for SEO, include timestamps if relevant, add links section at bottom.',
  },
  tiktok: {
    maxLength: 150,
    style: 'short, punchy, trendy. 3-5 hashtags inline. Casual Gen-Z friendly tone.',
  },
  linkedin: {
    maxLength: 700,
    style: 'professional, insightful, thought leadership tone. No emojis. Include a question to drive comments.',
  },
  telegram: {
    maxLength: 400,
    style: 'clear and informative. Support HTML formatting like <b>bold</b>. Direct and to the point.',
  },
  website: {
    maxLength: 2000,
    style: 'SEO-optimised blog-style content. Use headings and paragraphs. Include keywords naturally.',
  },
};

async function generateCaptions({ topic, businessName, tone, platforms, mediaDescription, language = 'English' }) {
  const platformInstructions = platforms
    .map(p => PLATFORM_STYLES[p])
    .filter(Boolean)
    .map((s, i) => `${platforms[i].toUpperCase()}: ${s.style} (max ${s.maxLength} chars)`)
    .join('\n');

  const prompt = `You are a professional social media manager for ${businessName || 'a business'}.

Generate platform-specific captions for the following content:
Topic/Product: ${topic}
Tone: ${tone || 'professional yet approachable'}
Media: ${mediaDescription || 'promotional post'}
Language: ${language}

Generate a caption for each platform below. Return ONLY a valid JSON object with platform names as keys and captions as values. No preamble.

Platforms and style requirements:
${platformInstructions}

Format: {"facebook": "...", "instagram": "...", ...}`;

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = message.content[0].text.trim();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON in response');
    return JSON.parse(jsonMatch[0]);
  } catch (err) {
    logger.error('AI caption generation error:', err);
    throw new Error('Failed to generate captions');
  }
}

async function generateHashtags({ topic, platform, count = 20 }) {
  const prompt = `Generate ${count} relevant hashtags for a ${platform} post about: "${topic}".
Return ONLY a JSON array of hashtag strings (include the # symbol). No preamble.
Example: ["#marketing", "#socialmedia"]`;

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 500,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = message.content[0].text.trim();
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) return [];
  return JSON.parse(jsonMatch[0]);
}

async function generateContentIdeas({ businessDescription, niche, platforms, count = 10 }) {
  const prompt = `You are a digital marketing strategist. Generate ${count} creative content ideas for:
Business: ${businessDescription}
Niche: ${niche || 'general'}
Platforms: ${platforms.join(', ')}

Return ONLY a JSON array of objects with this shape:
[{"title": "...", "description": "...", "platforms": [...], "contentType": "video|image|carousel|text", "estimatedEngagement": "high|medium|low"}]`;

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2000,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = message.content[0].text.trim();
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) return [];
  return JSON.parse(jsonMatch[0]);
}

async function analyzeBestPostingTimes({ platform, audienceTimezone, industryNiche }) {
  const prompt = `Based on industry data, what are the best days and times to post on ${platform} for a ${industryNiche || 'general'} business with audience in ${audienceTimezone || 'UTC'}?
Return ONLY a JSON object: {"bestDays": [...], "bestTimes": [...], "worstTimes": [...], "rationale": "..."}`;

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 600,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = message.content[0].text.trim();
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return {};
  return JSON.parse(jsonMatch[0]);
}

async function chat({ messages, workspaceContext }) {
  const system = `You are OmniPost AI, an expert digital marketing assistant integrated into a multi-platform content management system.
${workspaceContext ? `Workspace context: ${JSON.stringify(workspaceContext)}` : ''}
Help users with: content strategy, caption writing, hashtag research, analytics interpretation, scheduling advice, and platform-specific best practices. Be concise and actionable.`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1000,
    system,
    messages,
  });

  return response.content[0].text;
}

module.exports = { generateCaptions, generateHashtags, generateContentIdeas, analyzeBestPostingTimes, chat };
