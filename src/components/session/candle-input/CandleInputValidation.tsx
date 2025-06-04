
interface CandleInputValidationProps {
  errors: string[];
  isFormValid: boolean;
}

const CandleInputValidation = ({ errors, isFormValid }: CandleInputValidationProps) => {
  return (
    <>
      {errors.length > 0 && (
        <div className="mb-4 p-3 bg-red-600/20 border border-red-600/50 rounded-lg">
          <div className="text-red-200 text-sm">
            {errors.map((error, index) => (
              <div key={index}>• {error}</div>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="text-sm text-slate-400">
          {isFormValid ? (
            <span className="text-green-400">✓ Данные корректны</span>
          ) : (
            <span className="text-orange-400">Заполните все поля корректно</span>
          )}
        </div>
      </div>
    </>
  );
};

export default CandleInputValidation;
