import MultiSelectFilter from "./MultiSelectFilter";

const SPECIES_OPTIONS = [
  "Humans",
  "Cows",
  "Pigs",
  "Poultry (domestic)",
  "Livestock (domestic)",
  "Plants",
  "Horses",
  "Dogs",
  "Birds",
  "Sheep",
  "Cats",
  "Chicken",
  "Deer",
  "Crops",
  "Bats",
  "Goats",
  "Non-human animal",
  "Fish (osteichthyes)",
  "Boar",
  "Primates",
  "Ducks (domestic)",
  "Fox",
  "Elephant",
  "Camel",
  "Raccoon",
  "Buffalo",
  "Ducks (wild)",
  "Rabbits",
  "Monkeys",
  "Turkey",
  "Swan",
  "Environment",
  "Crows",
  "Soybean",
  "Bees",
  "Mink",
  "Dogs (wild)",
  "Salmon",
  "Equines",
  "Rabbits (wild)",
  "Seals",
  "Geese",
  "Wheat",
  "Hippopotamus",
  "Mosquito",
  "Lions",
  "Dolphins",
  "Mammals",
  "Skunks",
  "Pigeons"
];

export default function SpeciesFilter({ value, onChange }) {
  return (
    <MultiSelectFilter
      label="Species"
      options={SPECIES_OPTIONS}
      value={value}
      onChange={onChange}
    />
  );
}