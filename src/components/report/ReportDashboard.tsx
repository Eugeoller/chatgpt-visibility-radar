
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, BarChart3, FileCheck, AlertTriangle } from "lucide-react";

interface DashboardStats {
  totalReports: number;
  completedReports: number;
  processingReports: number;
  errorReports: number;
}

const ReportDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalReports: 0,
    completedReports: 0,
    processingReports: 0,
    errorReports: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchStats = async () => {
      try {
        setLoading(true);
        
        // Fetch all reports for the current user
        const { data, error } = await supabase
          .from('brand_questionnaires')
          .select(`
            id,
            status,
            final_reports(status)
          `)
          .eq('user_id', user.id);
          
        if (error) throw error;
        
        // Calculate stats
        const reportStats = {
          totalReports: data.length,
          completedReports: 0,
          processingReports: 0,
          errorReports: 0
        };
        
        // Count reports by status
        data.forEach(report => {
          const finalStatus = report.final_reports?.[0]?.status || report.status;
          
          if (finalStatus === 'ready') {
            reportStats.completedReports++;
          } else if (finalStatus === 'processing') {
            reportStats.processingReports++;
          } else if (finalStatus === 'error') {
            reportStats.errorReports++;
          }
        });
        
        setStats(reportStats);
      } catch (error) {
        console.error("Error fetching report stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user]);

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-blue-bright" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-500">Total de informes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center">
            <BarChart3 className="h-6 w-6 text-blue-bright mr-2" />
            <span className="text-3xl font-bold">{stats.totalReports}</span>
          </div>
        </CardContent>
        <CardFooter className="pt-0">
          <Button variant="outline" asChild className="w-full">
            <Link to="/informes">Ver todos</Link>
          </Button>
        </CardFooter>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-500">Informes completados</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center">
            <FileCheck className="h-6 w-6 text-green-600 mr-2" />
            <span className="text-3xl font-bold">{stats.completedReports}</span>
          </div>
        </CardContent>
        <CardFooter className="pt-0">
          <Button variant="outline" asChild className="w-full">
            <Link to="/informes">Ver completados</Link>
          </Button>
        </CardFooter>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-500">En procesamiento</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center">
            <Loader2 className="h-6 w-6 text-yellow-500 mr-2 animate-spin" />
            <span className="text-3xl font-bold">{stats.processingReports}</span>
          </div>
        </CardContent>
        <CardFooter className="pt-0">
          <Button variant="outline" asChild className="w-full">
            <Link to="/informes">Ver en proceso</Link>
          </Button>
        </CardFooter>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-500">Con errores</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center">
            <AlertTriangle className="h-6 w-6 text-red-600 mr-2" />
            <span className="text-3xl font-bold">{stats.errorReports}</span>
          </div>
        </CardContent>
        <CardFooter className="pt-0">
          <Button variant="outline" asChild className="w-full">
            <Link to="/informes">Ver con errores</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default ReportDashboard;
