import React from "react";
import { Card, Button, IconButton } from "react-native-paper";
import FormInput from "./FormInput";

const CertificationSection = ({ certifications, setCertifications, errors }) => {
  const add = () =>
    setCertifications([...certifications, { courseName: "", certificateNumber: "" }]);

  const update = (i, k, v) => {
    const arr = [...certifications];
    arr[i][k] = v;
    setCertifications(arr);
  };

  const remove = (i) => setCertifications(certifications.filter((_, idx) => idx !== i));

  return (
    <>
      {certifications.map((cert, i) => (
        <Card key={i} style={{ marginBottom: 20 }}>
          <Card.Title
            title={cert.courseName || "New Certification"}
            right={() => <IconButton icon="delete" onPress={() => remove(i)} />}
          />
          <Card.Content>
            <FormInput
              label="Certification Name *"
              value={cert.courseName}
              onChangeText={(t) => update(i, "courseName", t)}
              error={errors[`certName_${i}`]}
            />
            <FormInput
              label="Certificate Number *"
              value={cert.certificateNumber}
              onChangeText={(t) => update(i, "certificateNumber", t)}
              error={errors[`certNum_${i}`]}
            />
          </Card.Content>
        </Card>
      ))}
      <Button mode="outlined" onPress={add}>+ Add Certification</Button>
    </>
  );
};

export default CertificationSection;
