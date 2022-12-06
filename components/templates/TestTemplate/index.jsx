import { YoButton } from 'yoembed';

function App({ templateId }) {
  return (
    <div className="flex justify-center items-center mt-3">
      <br />
      <YoButton
        btnText="Import CSV"
        templateId={templateId}
        yoHostUrl={'http://localhost:3000'}
      />
    </div>
  );
}

export default App;
