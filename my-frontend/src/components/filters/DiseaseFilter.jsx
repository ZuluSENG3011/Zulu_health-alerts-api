import MultiSelectFilter from "./MultiSelectFilter";

const DISEASE_OPTIONS = [
  "Dengue",
  "Avian Influenza",
  "COVID-19",
  "Measles",
  "Cholera",
  "Rabies",
  "Anthrax",
  "Not Yet Classified",
  "Antimicrobial resistance",
  "Other Plant Disease",
  "Foot and Mouth",
  "Ebola",
  "Undiagnosed",
  "Malaria",
  "Foodborne Illness",
  "Influenza",
  "Yellow Fever",
  "Salmonella",
  "Poisoning",
  "Hantavirus",
  "Other Animal Disease",
  "African Swine Fever",
  "Polio",
  "West Nile Virus",
  "Avian Influenza H5N1",
  "E. coli",
  "Influenza H1N1",
  "Chikungunya",
  "Botulism",
  "Meningitis",
  "MERS",
  "Tuberculosis",
  "Crimean-Congo Hemorrhagic Fever",
  "HIV/AIDS",
  "Gastroenteritis",
  "Leptospirosis",
  "Legionnaires'",
  "Other Human Disease",
  "Brucellosis",
  "Plague",
  "Hepatitis",
  "Leishmaniasis",
  "BSE",
  "Mpox",
  "Diarrhea",
  "Zika virus",
  "Lassa Fever",
  "Japanese Encephalitis",
  "Norovirus",
  "Avian Influenza H7N9"
];

export default function DiseaseFilter({ value, onChange }) {
  return (
    <MultiSelectFilter
      label="Disease"
      options={DISEASE_OPTIONS}
      value={value}
      onChange={onChange}
    />
  );
}