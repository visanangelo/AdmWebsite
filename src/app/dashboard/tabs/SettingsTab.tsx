import React from 'react'
import { Card, CardHeader, CardContent, CardTitle } from "@/features/shared/components/ui/card"
import { Button } from "@/features/shared/components/ui/button"
import { Switch } from "@/features/shared/components/ui/switch"
import { Label } from "@/features/shared/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/features/shared/components/ui/select"

interface SettingsTabProps {
  autoRefreshEnabled: boolean
  refreshInterval: number
  onSetAutoRefreshEnabled: (enabled: boolean) => void
  onSetRefreshInterval: (interval: number) => void
}

const SettingsTab: React.FC<SettingsTabProps> = ({
  autoRefreshEnabled,
  refreshInterval,
  onSetAutoRefreshEnabled,
  onSetRefreshInterval
}) => {
  return (
    <div className="max-w-4xl w-full mx-auto px-4 md:px-6 pb-12">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Auto Refresh Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Enable Auto Refresh</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically refresh data at regular intervals
                </p>
              </div>
              <Switch
                checked={autoRefreshEnabled}
                onCheckedChange={onSetAutoRefreshEnabled}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Refresh Interval</Label>
                <p className="text-sm text-muted-foreground">
                  How often to refresh the data
                </p>
              </div>
              <Select
                value={refreshInterval.toString()}
                onValueChange={(value) => onSetRefreshInterval(parseInt(value))}
                disabled={!autoRefreshEnabled}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5000">5 seconds</SelectItem>
                  <SelectItem value="10000">10 seconds</SelectItem>
                  <SelectItem value="30000">30 seconds</SelectItem>
                  <SelectItem value="60000">1 minute</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default SettingsTab 