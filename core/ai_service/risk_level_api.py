from google import genai
from google.genai import types
from datetime import date
import os

os.getenv("GEMINI_API_KEY")


class GeminiRiskLevel:
    """
    Service for generating country-level travel risk assessments using Gemini.

    This service evaluates:
    - outbreak alert data
    - disease metadata

    and produces a structured risk level (low / medium / high) with justification.
    """
    response_schema = {
        "type": "object",
        "description": (
            "Structured country-level infectious disease travel-risk assessment "
            "based only on the provided outbreak alerts and disease metadata."
        ),
        "additionalProperties": False,
        "properties": {
            "risk_level": {
                "type": "string",
                "description": (
                    "Overall country-level travel-risk level based only on the "
                    "provided recent alert evidence and disease metadata."
                ),
                "enum": ["low", "medium", "high"],
            },
            "reason": {
                "type": "string",
                "description": (
                    "A short and objective explanation paragraph for why "
                    "the selected risk level was assigned to this country."
                    ""
                ),
                "minLength": 1,
            },
            "supporting_alert_ids": {
                "type": "array",
                "description": (
                    "All he most relevant alert external ids that directly support "
                    "the assigned country risk level."
                ),
                "items": {
                    "type": "string",
                    "description": "An alert external id used as supporting evidence.",
                },
            },
        },
        "required": [
            "risk_level",
            "reason",
            "supporting_alert_ids",
        ],
    }

    def __init__(self, api_key: str, model_id: str):
        if not api_key:
            raise ValueError("API key is missing.")
        self.api_key = api_key
        self.client = genai.Client(api_key=api_key)
        self.model_id = model_id

    def risk_level(self, alerts: list, country: str, disease_info: dict = {}):
        """
        Generate a country-level travel risk assessment.

        The model must:
        - use ONLY provided alerts + disease metadata
        - NOT use external knowledge
        - assign a risk level based on strength of evidence

        Args:
            alerts (list): Filtered alert dataset relevant to the country
            country (str): Country being assessed
            disease_info (dict): Disease metadata (severity, exposure)

        Returns:
            dict: Structured response:
                - risk_level (low / medium / high)
                - reason
                - supporting_alert_ids

        Raises:
            RuntimeError: If Gemini request fails
        """
        prompt = f"""
            You are assessing infectious disease risk for an
            airport-oriented travel
            safety service for short- and medium-term visitors,
            You assessments must base on alert and diseases
            information provided below as list.

            Assess base on the provided outbreak alerts
            and the provided disease
            metadata, DO NOT RESEARCH.
            Do not use web search, external sources, tools,
            or unstated medical facts.
            You can mention if the provided
            data is insufficient for a conclusion.

            Assume customers are likely to move through airports, public
            transport, hotels, tourist sites and other shared public
            infrastructure that can be moderately crowded or crowded.
            Do not Assume visitors stay at home most of the time.
            Do not assume they remain only in major urban areas.
            Do not assume unusual occupational, agricultural,
            or long term community exposure.

            Pay attention to the publish date of alerts.
            Today is {date.today()}.
            The country is {country}.
            Carefully assess only this country-level context.

            Repeated alerts for the same disease or area may indicate
            a stronger signal, but do not overstate certainty
            beyond the provided evidence.

            Your task is to create a concise, objective country-level
            travel-risk assessment by using:
            1. outbreak evidence from the provided filtered alerts
            2. disease-level context from the provided disease metadata

            Assign an overall country risk level:
            - high: use only when the provided evidence shows a strong recent signal,
            such as multiple recent meaningful alerts, or recent alerts involving
            clearly high severity or high exposure diseases with meaningful
            travel relevance
            - medium: use when some meaningful signal exists, but the evidence is mixed,
            limited, moderate, not repeated enough, or not strong enough for high
            - low: use when there are no relevant alerts, or when the provided evidence
            is sparse, weak, old, indirect, or does not show a meaningful current signal
            for typical travelers

            Do not default to high.
            Do not treat a single recent alert as automatically high.
            Medium and low are both valid outcomes and should be used whenever the
            provided evidence does not clearly justify high.
            If the evidence is limited or mixed, prefer the lower reasonable level.
            If there are no relevant alerts for the country in the provided evidence,
            assign low risk.
            If the provided evidence is sparse, weak, indirect, or not recent,
            do not overstate the risk level.
            Use medium or low whenever high is not clearly justified
            by the provided evidence.

            The reason must be short and objective.
            supporting_alert_ids should include only the key alerts you relied on.

            Return only valid JSON matching the required schema.

            Provided alerts:
            {alerts}

            Provided disease metadata:
            {disease_info}
        """

        # schema_str = json.dumps(self.response_schema, indent=2)

        try:
            response = self.client.models.generate_content(
                model=self.model_id,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_json_schema=self.response_schema,
                    response_mime_type="application/json",
                    temperature=0.2,
                ),
            )
            print(response.parsed)
            return response.parsed

        except Exception as e:
            raise RuntimeError(f"{self.model_id} request crashed: {e}")


if __name__ == "__main__":
    api_key = os.getenv("GEMINI_API_KEY")
    if api_key is None:
        print("GEMINI_API_KEY not set")
        raise ValueError("GEMINI_API_KEY not set")

    AI = GeminiRiskLevel(api_key, model_id="gemini-3-flash-preview")
    # # AI = GeminiService(API_KEY, model_id="gemini-3.1-pro-preview")
    # while True:
    #     user_input = input("\ninput diseases:")
    #     diseases = set(user_input.split())
    #     print(diseases)
    #     AI.disease_assessment(diseases)
