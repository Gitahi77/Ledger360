import * as React from 'react';

export function Responsive() {
  return (
    <section className="space-y-8">
      <div>
        <h3 className="text-2xl font-bold tracking-tight mb-2 border-b pb-2">RESPONSIVE</h3>
        <p className="text-muted-foreground">Viewport matrix and responsive behaviors.</p>
      </div>

      <div className="space-y-6">
        <div className="p-6 border rounded-xl bg-card">
          <h4 className="text-lg font-semibold mb-4">Supported Viewport Matrix</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
                <tr>
                  <th className="px-6 py-3 rounded-tl-lg">Device</th>
                  <th className="px-6 py-3">Width</th>
                  <th className="px-6 py-3 rounded-tr-lg">Layout Behavior</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="px-6 py-4 font-medium">Small phone</td>
                  <td className="px-6 py-4">320px</td>
                  <td className="px-6 py-4">1 column, bottom sheets, sticky bottom nav</td>
                </tr>
                <tr className="border-b">
                  <td className="px-6 py-4 font-medium">Standard phone</td>
                  <td className="px-6 py-4">375px</td>
                  <td className="px-6 py-4">1 column, bottom sheets, sticky bottom nav</td>
                </tr>
                <tr className="border-b">
                  <td className="px-6 py-4 font-medium">Large phone</td>
                  <td className="px-6 py-4">390-430px</td>
                  <td className="px-6 py-4">1 column, bottom sheets, sticky bottom nav</td>
                </tr>
                <tr className="border-b">
                  <td className="px-6 py-4 font-medium">Small tablet</td>
                  <td className="px-6 py-4">768px (md)</td>
                  <td className="px-6 py-4">2 columns, dialogs, sidebar possible</td>
                </tr>
                <tr className="border-b">
                  <td className="px-6 py-4 font-medium">Large tablet</td>
                  <td className="px-6 py-4">1024px (lg)</td>
                  <td className="px-6 py-4">2-3 columns, dialogs, persistent sidebar</td>
                </tr>
                <tr className="border-b">
                  <td className="px-6 py-4 font-medium">Laptop</td>
                  <td className="px-6 py-4">1280px (xl)</td>
                  <td className="px-6 py-4">3 columns, max-width container, persistent sidebar</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 font-medium">Desktop</td>
                  <td className="px-6 py-4">1440px+ (2xl)</td>
                  <td className="px-6 py-4">Max-width container (max-w-7xl), centered content</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        
        <div className="p-6 border rounded-xl bg-primary/5 border-primary/20">
          <p className="text-sm font-medium text-primary">
            Resize your browser window to test fluid typography, layout gutters, and the ResponsiveDialog behavior.
          </p>
        </div>
      </div>
    </section>
  );
}
