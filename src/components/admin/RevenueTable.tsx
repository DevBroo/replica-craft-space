import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/admin/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/admin/ui/table';
import { Button } from '@/components/admin/ui/button';
import { Badge } from '@/components/admin/ui/badge';
import { ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react';

interface TableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  formatter?: (value: any) => React.ReactNode;
}

interface RevenueTableProps {
  title: string;
  description?: string;
  data: any[];
  columns: TableColumn[];
  sortBy: string;
  sortDir: 'asc' | 'desc';
  currentPage: number;
  totalPages: number;
  onSort: (key: string) => void;
  onPageChange: (page: number) => void;
  loading?: boolean;
}

export default function RevenueTable({
  title,
  description,
  data,
  columns,
  sortBy,
  sortDir,
  currentPage,
  totalPages,
  onSort,
  onPageChange,
  loading = false
}: RevenueTableProps) {
  const formatCurrency = (value: number) => `₹${value.toLocaleString()}`;
  
  const formatNumber = (value: number) => value.toLocaleString();

  const getDefaultFormatter = (key: string) => {
    if (key.includes('revenue') || key.includes('amount')) {
      return formatCurrency;
    }
    if (key.includes('count') || key.includes('total')) {
      return formatNumber;
    }
    return (value: any) => value;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-muted rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((column) => (
                  <TableHead key={column.key}>
                    {column.sortable ? (
                      <Button
                        variant="ghost"
                        onClick={() => onSort(column.key)}
                        className="h-auto p-0 font-semibold"
                      >
                        {column.label}
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                        {sortBy === column.key && (
                          <Badge variant="outline" className="ml-2">
                            {sortDir}
                          </Badge>
                        )}
                      </Button>
                    ) : (
                      column.label
                    )}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.length > 0 ? (
                data.map((row, index) => (
                  <TableRow key={index}>
                    {columns.map((column) => (
                      <TableCell key={column.key}>
                        {column.formatter 
                          ? column.formatter(row[column.key])
                          : getDefaultFormatter(column.key)(row[column.key])
                        }
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="text-center py-8">
                    No data available
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange(currentPage - 1)}
                  disabled={currentPage <= 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange(currentPage + 1)}
                  disabled={currentPage >= totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}