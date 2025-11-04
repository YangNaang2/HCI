import { animalList, Animal } from "../util/animalData";

interface AnimalBlockProps {
    animalIdx: number;
    buttonName: "f1" | "f2" | "f3" | "f4";
}

export default function AnimalBlock({ animalIdx, buttonName }: AnimalBlockProps) {
    let pose = "";
    if (buttonName === "f1") {
        pose = animalList[animalIdx].pose1;
    } else if (buttonName === "f2") {
        pose = animalList[animalIdx].pose2;
    } else if (buttonName === "f3") {
        pose = animalList[animalIdx].pose3;
    }

    return (
        <div>
            <div>
                <h2>Animal: {animalList[animalIdx].name}</h2>
                <h2>Pose: {pose}</h2>
            </div>
            <h1>Dictionary</h1>
            <div className="dictionary-container">
                {animalList.map((animal, index) => {
                    const isSelected = index === animalIdx;
                    return (
                        <div
                            key={index}
                            className={`dictionary-animal-block ${isSelected ? "active" : ""}`}
                        >
                            <h3>{animal.name}</h3>
                            <span>{animal.pose1} / {animal.pose2} / {animal.pose3}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}