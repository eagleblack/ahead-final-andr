import React from "react";
import { View } from "react-native";
import { Card, IconButton, Button } from "react-native-paper";
import FormInput from "./FormInput";

const EducationSection = ({ education, setEducation, errors }) => {
  const addEducation = () =>
    setEducation([...education, { degree: "", institution: "", from: "", to: "" }]);

  const update = (i, key, val) => {
    const arr = [...education];
    arr[i][key] = val;
    setEducation(arr);
  };

  const remove = (i) => setEducation(education.filter((_, idx) => idx !== i));

  return (
    <>
      {education.map((edu, i) => (
        <Card key={i} style={{ marginBottom: 20 }}>
          <Card.Title
            title={edu.degree || "New Education"}
            right={() => <IconButton icon="delete" onPress={() => remove(i)} />}
          />
          <Card.Content>
            <FormInput
              label="Degree *"
              value={edu.degree}
              onChangeText={(t) => update(i, "degree", t)}
              error={errors[`degree_${i}`]}
            />
            <FormInput
              label="Institution *"
              value={edu.institution}
              onChangeText={(t) => update(i, "institution", t)}
              error={errors[`institution_${i}`]}
            />
          </Card.Content>
        </Card>
      ))}
      <Button mode="outlined" onPress={addEducation}>+ Add Education</Button>
    </>
  );
};

export default EducationSection;
