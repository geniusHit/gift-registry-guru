import React, { useState } from "react";
import { SaveBar as NewSaveBar, useAppBridge } from "@shopify/app-bridge-react";
 
const SaveBar2 = ({ savebarid, handlechange, handlediscard }) => {
  const shopify = useAppBridge();
  const [saving, setSaving] = useState(false);
 
  const onSave = async () => {
    try {
      setSaving(true);
 
      await handlechange();
      shopify.saveBar.hide(savebarid);
    } catch (e) {
      shopify.toast.show("Error while saving", { isError: true });
    } finally {
      setSaving(false);
    }
  };
 
  return (
    <NewSaveBar id={savebarid}>
      <button variant="primary" onClick={onSave} loading={saving}>
        Save
      </button>
      <button onClick={handlediscard}>Discard</button>
    </NewSaveBar>
  );
};
 
export default SaveBar2;