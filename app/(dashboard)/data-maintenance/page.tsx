'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Plus, Package, DollarSign, CreditCard, Ruler, Store } from 'lucide-react';
import { DataMaintenanceTable } from '@/components/data-maintenance/data-maintenance-table';
import { DataMaintenanceDialog } from '@/components/data-maintenance/data-maintenance-dialog';
import {
  ReferenceDataType,
  ReferenceDataBase,
  REFERENCE_DATA_CONFIGS,
} from '@/types/data-maintenance.types';
import { toast } from 'sonner';

const ICON_MAP: Record<string, any> = {
  Package,
  DollarSign,
  CreditCard,
  Ruler,
  Store,
};

export default function DataMaintenancePage() {
  const [activeTab, setActiveTab] = useState<ReferenceDataType>('product-categories');
  const [data, setData] = useState<Record<ReferenceDataType, any[]>>({
    'product-categories': [],
    'expense-categories': [],
    'payment-methods': [],
    'units-of-measure': [],
    'expense-vendors': [],
  });
  const [loading, setLoading] = useState<Record<ReferenceDataType, boolean>>({
    'product-categories': false,
    'expense-categories': false,
    'payment-methods': false,
    'units-of-measure': false,
    'expense-vendors': false,
  });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ReferenceDataBase | null>(null);

  useEffect(() => {
    fetchData(activeTab);
  }, [activeTab]);

  const fetchData = async (type: ReferenceDataType) => {
    setLoading((prev) => ({ ...prev, [type]: true }));

    try {
      const response = await fetch(`/api/data-maintenance/${type}`);
      const result = await response.json();

      if (result.success) {
        setData((prev) => ({ ...prev, [type]: result.data }));
      } else {
        toast.error(`Failed to load ${REFERENCE_DATA_CONFIGS[type].title}`);
      }
    } catch (error) {
      toast.error('An error occurred while loading data');
    } finally {
      setLoading((prev) => ({ ...prev, [type]: false }));
    }
  };

  const handleAdd = () => {
    setSelectedItem(null);
    setDialogOpen(true);
  };

  const handleEdit = (item: ReferenceDataBase) => {
    setSelectedItem(item);
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setSelectedItem(null);
  };

  const handleSuccess = () => {
    fetchData(activeTab);
  };

  const config = REFERENCE_DATA_CONFIGS[activeTab];
  const Icon = ICON_MAP[config.icon];

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Data Maintenance</h1>
          <p className="text-muted-foreground">
            Manage reference data and lookup tables
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as ReferenceDataType)}>
        <TabsList className="grid w-full grid-cols-5">
          {Object.keys(REFERENCE_DATA_CONFIGS).map((key) => {
            const tabConfig = REFERENCE_DATA_CONFIGS[key as ReferenceDataType];
            const TabIcon = ICON_MAP[tabConfig.icon];
            return (
              <TabsTrigger key={key} value={key} className="flex items-center gap-2">
                <TabIcon className="h-4 w-4" />
                <span className="hidden sm:inline">{tabConfig.title}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {Object.keys(REFERENCE_DATA_CONFIGS).map((key) => {
          const tabConfig = REFERENCE_DATA_CONFIGS[key as ReferenceDataType];
          const tabType = key as ReferenceDataType;

          return (
            <TabsContent key={key} value={key} className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="flex items-center gap-2">
                        <Icon className="h-5 w-5" />
                        {tabConfig.title}
                      </CardTitle>
                      <CardDescription>{tabConfig.description}</CardDescription>
                    </div>
                    <Button onClick={handleAdd}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add {tabConfig.singularTitle}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <DataMaintenanceTable
                    data={data[tabType]}
                    config={tabConfig}
                    onEdit={handleEdit}
                    onRefresh={handleSuccess}
                    isLoading={loading[tabType]}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          );
        })}
      </Tabs>

      <DataMaintenanceDialog
        open={dialogOpen}
        onClose={handleDialogClose}
        config={config}
        item={selectedItem}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
