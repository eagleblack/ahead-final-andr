import React from "react";
import { Card } from "react-native-paper";
import FormInput from "./FormInput";

const PersonalInfoSection = ({ name, setName, dob, setDob, bio, setBio, errors }) => {
  return (
    <Card style={{ marginBottom: 20, borderRadius: 16 }}>
      <Card.Content>
        <FormInput
          label="Full Name *"
          value={name}
          onChangeText={setName}
          error={errors.name}
        />

        <FormInput
          label="Date of Birth"
          placeholder="DD/MM/YYYY"
          value={dob}
          onChangeText={setDob}
        />

        <FormInput
          label="Bio"
          multiline
          numberOfLines={4}
          value={bio}
          onChangeText={(t) => t.length <= 200 && setBio(t)}
        />
      </Card.Content>
    </Card>
  );
};

export default PersonalInfoSection;
