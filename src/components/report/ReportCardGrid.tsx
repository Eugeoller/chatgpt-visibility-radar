
import ReportCard, { Report } from "./ReportCard";

interface ReportCardGridProps {
  reports: Report[];
  onRetry: (reportId: string) => void;
  onProcessNextBatch: (reportId: string) => void;
  onProcessAllBatches: (reportId: string) => void;
}

const ReportCardGrid = ({ reports, onRetry, onProcessNextBatch, onProcessAllBatches }: ReportCardGridProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {reports.map((report) => (
        <ReportCard 
          key={report.id}
          report={report}
          onRetry={onRetry}
          onProcessNextBatch={onProcessNextBatch}
          onProcessAllBatches={onProcessAllBatches}
        />
      ))}
    </div>
  );
};

export default ReportCardGrid;
