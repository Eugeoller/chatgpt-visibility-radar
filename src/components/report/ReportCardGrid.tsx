
import ReportCard, { Report } from "./ReportCard";

interface ReportCardGridProps {
  reports: Report[];
  onRetry: (reportId: string) => void;
}

const ReportCardGrid = ({ reports, onRetry }: ReportCardGridProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {reports.map((report) => (
        <ReportCard 
          key={report.id}
          report={report}
          onRetry={onRetry}
        />
      ))}
    </div>
  );
};

export default ReportCardGrid;
