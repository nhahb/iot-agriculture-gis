import { toast } from "sonner";
import { Input } from "../ui/input";
import { Button } from "../ui/button";

const FieldEditDialog = ({
    drawRef,
    editingFeature,
    setEditingFeature,
    updateField,
    fieldName,
    setFieldName,
    fieldAddress,
    setFieldAddress
}) => {

    const handleSaveEdit = async () => {
    const feature = drawRef.current.get(editingFeature.drawFeatureId);
    console.log(feature);
    const fieldData = {name: fieldName, geometry:feature.geometry, address: fieldAddress};
    try {
      await updateField(editingFeature.fieldId, fieldData);
      drawRef.current.delete(editingFeature.drawFeatureId);
      setEditingFeature(null);
      setFieldName('');
      setFieldAddress('');
      toast.success('Cập nhật thành công');
    } catch (err) {
      console.log(err);
      toast.error('Cập nhật thất bại');
    }
  };

  const handleCancelEdit = () => {
    drawRef.current.delete(editingFeature.drawFeatureId);
    setEditingFeature(null);
    setFieldAddress('');
    setFieldName('');
  };

    return (
        <>
            {
  editingFeature && (
    <div
      className="
        absolute
        top-4
        left-1/2
        -translate-x-1/2
        bg-white
        shadow-lg
        rounded-lg
        p-3
        flex gap-2
        z-20
      "
    >
      <Input
        type='text'
        value = {fieldName}
        onChange = {(e) => setFieldName(e.target.value)}
      ></Input>
      <Input
        type='text'
        value = {fieldAddress}
        onChange = {(e) => setFieldAddress(e.target.value)}
        placeholder="Địa chỉ"
      ></Input>
      <Button
        onClick={handleSaveEdit}
      >
        Lưu
      </Button>
      <Button
        variant="outline"
        onClick={handleCancelEdit}
      >
        Hủy
      </Button>
    </div>
  )
}
        </>
    );
};

export default FieldEditDialog;