import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface ClaimsTableProps {
  claims: Array<{
    id: number;
    claimNumber: string;
    jobId: number;
    status: string;
    dateSubmitted: string;
  }>;
}

export default function ClaimsTable({ claims }: ClaimsTableProps) {
  // Format date to a more readable format
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  // Get status badge style
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Recent Warranty Claims</CardTitle>
        <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">
          {claims.filter(claim => claim.status === 'pending').length} Pending Approval
        </span>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Claim #</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>Issue</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {claims.map((claim) => (
                <TableRow key={claim.id} className="hover:bg-gray-50">
                  <TableCell className="font-medium text-primary-600">
                    {claim.claimNumber}
                  </TableCell>
                  <TableCell className="text-sm text-gray-700">
                    {/* This would be replaced with actual unit details from an API call */}
                    Job #{claim.jobId}
                  </TableCell>
                  <TableCell className="text-sm text-gray-700">
                    {/* This would be replaced with actual issue details from an API call */}
                    Warranty Claim
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadgeClass(claim.status)}`}>
                      {claim.status.charAt(0).toUpperCase() + claim.status.slice(1)}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {formatDate(claim.dateSubmitted)}
                  </TableCell>
                  <TableCell className="text-right text-sm">
                    <Button variant="link" className="text-primary-600 hover:text-primary-900">
                      {claim.status === 'pending' ? 'Review' : 
                       claim.status === 'rejected' ? 'Resubmit' : 'View'}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="p-4 border-t border-gray-200 bg-gray-50 mt-4">
          <a href="/claims" className="text-sm font-medium text-primary-600 hover:text-primary-700 flex items-center justify-center">
            View all claims
            <span className="material-icons ml-1 text-sm">arrow_forward</span>
          </a>
        </div>
      </CardContent>
    </Card>
  );
}
