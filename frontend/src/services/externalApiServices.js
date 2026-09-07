import axios from "axios";

export const externalApiServices = {
  getAccessToken,
  searchSkills,
  searchCompanies,
  searchUniversities,
};

async function getAccessToken() {
  const clientId = import.meta.env.VITE_LIGHTCAST_API_CLIENT_ID;
  const secret = import.meta.env.VITE_LIGHTCAST_API_SECRET;
  const scope = import.meta.env.VITE_LIGHTCAST_API_SCOPE;
  
  if (!clientId || !secret || !scope) {
    console.warn("Lightcast API credentials not configured");
    return null;
  }
  
  try {
    const params = new URLSearchParams();
    params.append("client_id", clientId);
    params.append("client_secret", secret);
    params.append("grant_type", "client_credentials");
    params.append("scope", scope);

    const config = {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    };

    const response = await axios.post(
      "https://auth.emsicloud.com/connect/token",
      params,
      config
    );

    return response.data.access_token;
  } catch (error) {
    console.error("Failed to fetch access token", error);
    return null;
  }
}

async function searchSkills(query) {
  const accessToken = await getAccessToken();

  if (!accessToken) {
    console.warn("Skills API not available - using fallback mode");
    return null; // Return null to indicate API is not available
  }

  try {
    const response = await axios.get(
      `https://emsiservices.com/skills/versions/latest/skills?q=${query}&limit=5`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    return response.data.data;
  } catch (error) {
    console.error("Failed to call skills API", error);
    return null; // Return null on error
  }
}

async function searchCompanies(query) {
  try {
    const response = await axios.get(
      `https://autocomplete.clearbit.com/v1/companies/suggest?query=${query}`
    );
    return response.data;
  } catch (error) {
    console.error("Failed to fetch data: ", error);
    return [];
  }
}

async function searchUniversities(query) {
  try {
    const response = await axios.get(
      `http://universities.hipolabs.com/search?name=${query}`
    );
    return response.data;
  } catch (error) {
    console.error("Failed to fetch data: ", error);
    return [];
  }
}
