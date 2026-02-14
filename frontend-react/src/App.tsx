import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend, AreaChart, Area 
} from 'recharts';
import { DollarSign, Globe, Zap, List, Database, Download, ShieldCheck, Search } from 'lucide-react';

const COLORS = ['#8b5cf6', '#3b82f6', '#06b6d4', '#10b981', '#f43f5e', '#f59e0b'];

function App() {
  const [data, setData] = useState([]);
  const [filters, setFilters] = useState({ service: 'All', region: 'All' });

  useEffect(() => {
    const apiUrl = "https";
    axios.get(apiUrl).then((res) => {
      const responseData = typeof res.data.body === "string" ? JSON.parse(res.data.body) : res.data;
      if (responseData && responseData.results) setData(responseData.results);
    }).catch(err => console.error("API Error:", err));
  }, []);

  const filteredData = useMemo(() => {
    return data.filter(item => (filters.service === 'All' || item.service === filters.service) && (filters.region === 'All' || item.region === filters.region));
  }, [data, filters]);

  const regionData = useMemo(() => {
    const groups = filteredData.reduce((acc, curr) => {
      acc[curr.region] = (acc[curr.region] || 0) + curr.cost;
      return acc;
    }, {});
    return Object.keys(groups).map(region => ({ region, cost: groups[region] }));
  }, [filteredData]);

  const timelineData = useMemo(() => {
    const groups = filteredData.reduce((acc, curr) => {
      acc[curr.date] = (acc[curr.date] || 0) + curr.cost;
      return acc;
    }, {});
    return Object.keys(groups).sort().map(date => ({ date, cost: groups[date] }));
  }, [filteredData]);

  const currentTotal = filteredData.reduce((acc, curr) => acc + (Number(curr.cost) || 0), 0);

  const exportToCSV = () => {
    const headers = "Date,Service,Region,Usage_Type,Operation,Usage_Qty,Unit,Cost\n";
    const csvRows = filteredData.map(item => {
      const amount = isNaN(parseFloat(item.amount)) ? "0.00" : parseFloat(item.amount).toFixed(2);
      return `${item.date},${item.service},${item.region},${item.usage_type || 'N/A'},${item.operation},${amount},${item.unit || ''},${item.cost}`;
    }).join("\n");

    const blob = new Blob([headers + csvRows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', `aws_sentinel_report_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div style={{ display: "flex", height: "100vh", backgroundColor: "#0b0e14", color: "#e2e8f0", fontFamily: "'Inter', sans-serif" }}>
      
      {/* SIDEBAR REESTILIZADA */}
      <aside style={{ 
        width: "280px", 
        backgroundColor: "#11141d", 
        margin: "15px", 
        borderRadius: "16px",
        padding: "30px", 
        display: "flex", 
        flexDirection: "column",
        boxShadow: "0 4px 20px rgba(0,0,0,0.5)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "50px" }}>
          <ShieldCheck color="#8b5cf6" size={28} strokeWidth={2.5} />
          <h2 style={{ fontSize: "20px", fontWeight: "700", letterSpacing: "-0.5px", background: "linear-gradient(to right, #B3ACFC, #A384FF)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Data Sentinel</h2>
        </div>
        
        <FilterBox label="AWS Service" value={filters.service} onChange={v => setFilters({...filters, service: v})} options={[...new Set(data.map(d => d.service))]} />
        <FilterBox label="Region" value={filters.region} onChange={v => setFilters({...filters, region: v})} options={[...new Set(data.map(d => d.region))]} />

        <button onClick={exportToCSV} style={{ 
          marginTop: "auto", 
          padding: "14px", 
          borderRadius: "12px", 
          backgroundColor: "#1e2230", 
          border: "1px solid #334155", 
          color: "#fff", 
          fontWeight: "600", 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "center", 
          gap: "10px", 
          cursor: "pointer",
          transition: "all 0.2s"
        }}>
          <Download size={18} color="#8b5cf6" /> Export Report
        </button>
      </aside>

      <main style={{ flex: 1, overflowY: "auto", padding: "15px 30px 30px 15px" }}>
        <nav style={{ 
          height: "80px", 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center",
          marginBottom: "20px"
        }}>
           <div>
             <h1 style={{ fontSize: "24px", fontWeight: "700", margin: 0 }}>Dashboard</h1>
             <p style={{ color: "#64748b", fontSize: "14px", margin: 0 }}>Data analytics and insights</p>
           </div>
           <div style={{ display: "flex", alignItems: "center", gap: "15px", backgroundColor: "#11141d", padding: "8px 16px", borderRadius: "12px", border: "1px solid #1e293b" }}>
             <div style={{ textAlign: "right" }}>
               <div style={{ fontSize: "12px", color: "#64748b" }}>Organization</div>
               <div style={{ fontSize: "14px", fontWeight: "600" }}>Your Company</div>
             </div>
             <div style={{ width: "36px", height: "36px", borderRadius: "10px", backgroundColor: "#8b5cf6", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold" }}>D</div>
           </div>
        </nav>

        {/* KPI CARDS - MAIS ELEGANTES */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px", marginBottom: "30px" }}>
          <KPICard title="Total Spend" value={`$${currentTotal.toLocaleString()}`} icon={<DollarSign size={20}/>} color="#8b5cf6" />
          <KPICard title="Usage Types" value={[...new Set(filteredData.map(d => d.usage_type))].length || 0} icon={<Database size={20}/>} color="#3b82f6" />
          <KPICard title="Active Regions" value={regionData.length} icon={<Globe size={20}/>} color="#06b6d4" />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: "20px", marginBottom: "20px" }}>
          <ChartBox title="Daily Cost Trend">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={timelineData}>
                <defs>
                  <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} opacity={0.5} />
                <XAxis dataKey="date" stroke="#475569" fontSize={10} axisLine={false} tickLine={false} />
                <YAxis stroke="#475569" fontSize={10} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: "#11141d", border: "1px solid #334155", borderRadius: "8px" }}
                  itemStyle={{ color: "#fff" }}
                />
                <Area type="monotone" dataKey="cost" stroke="#8b5cf6" strokeWidth={3} fill="url(#colorCost)" />
              </AreaChart>
            </ResponsiveContainer>
          </ChartBox>

          <ChartBox title="Regional Distribution">
             <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={regionData} dataKey="cost" nameKey="region" cx="50%" cy="50%" innerRadius={70} outerRadius={90} paddingAngle={5}>
                  {regionData.map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} stroke="none" />)}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </ChartBox>
        </div>

        {/* TABELA REESTILIZADA */}
        <div style={{ backgroundColor: "#11141d", padding: "24px", borderRadius: "16px", border: "1px solid #1e293b" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "25px" }}>
            <List color="#8b5cf6" size={20} />
            <h3 style={{ fontSize: "16px", fontWeight: "700", margin: 0 }}>Detailed Audit Log</h3>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", textAlign: "left" }}>
              <thead>
                <tr style={{ color: "#64748b", borderBottom: "1px solid #1e293b" }}>
                  <th style={{ padding: "16px 12px" }}>Date</th>
                  <th style={{ padding: "16px 12px" }}>Service</th>
                  <th style={{ padding: "16px 12px" }}>Usage Type</th>
                  <th style={{ padding: "16px 12px" }}>Operation</th>
                  <th style={{ padding: "16px 12px" }}>Qty</th>
                  <th style={{ padding: "16px 12px" }}>Cost</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.slice(0, 20).map((item, index) => {
                  const usageAmount = parseFloat(item.amount);
                  const displayAmount = isNaN(usageAmount) ? "0.00" : usageAmount.toFixed(2);
                  return (
                    <tr key={index} style={{ borderBottom: "1px solid #1e293b", transition: "background 0.2s" }} className="table-row">
                      <td style={{ padding: "16px 12px", color: "#64748b" }}>{item.date}</td>
                      <td style={{ padding: "16px 12px", fontWeight: "600" }}>{item.service}</td>
                      <td style={{ padding: "16px 12px" }}><span style={{ backgroundColor: "#1e2230", padding: "4px 8px", borderRadius: "6px", fontSize: "11px" }}>{item.usage_type || 'N/A'}</span></td>
                      <td style={{ padding: "16px 12px", color: "#64748b" }}>{item.operation}</td>
                      <td style={{ padding: "16px 12px" }}>{displayAmount} <span style={{fontSize: "10px", color: "#475569"}}>{item.unit}</span></td>
                      <td style={{ padding: "16px 12px", color: "#10b981", fontWeight: "700" }}>${Number(item.cost).toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}

function FilterBox({ label, value, onChange, options }) {
  return (
    <div style={{ marginBottom: "25px" }}>
      <label style={{ display: "block", color: "#64748b", fontSize: "11px", fontWeight: "700", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)} style={{ 
        width: "100%", 
        padding: "12px", 
        borderRadius: "10px", 
        backgroundColor: "#1a1e29", 
        border: "1px solid #334155", 
        color: "#fff", 
        outline: "none",
        fontSize: "14px"
      }}>
        <option value="All">All Resources</option>
        {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
      </select>
    </div>
  );
}

function KPICard({ title, value, icon, color }) {
  return (
    <div style={{ 
      backgroundColor: "#11141d", 
      padding: "24px", 
      borderRadius: "16px", 
      border: "1px solid #1e293b",
      position: "relative",
      overflow: "hidden"
    }}>
      <div style={{ position: "absolute", top: 0, left: 0, width: "4px", height: "100%", backgroundColor: color }}></div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
        <span style={{ color: "#64748b", fontSize: "14px", fontWeight: "500" }}>{title}</span>
        <div style={{ color: color, opacity: 0.8 }}>{icon}</div>
      </div>
      <h2 style={{ fontSize: "24px", fontWeight: "700", margin: 0, color: "#fff" }}>{value}</h2>
    </div>
  );
}

function ChartBox({ title, children }) {
  return (
    <div style={{ backgroundColor: "#11141d", padding: "24px", borderRadius: "16px", border: "1px solid #1e293b" }}>
      <h3 style={{ fontSize: "15px", fontWeight: "600", marginBottom: "20px", color: "#94a3b8" }}>{title}</h3>
      {children}
    </div>
  );
}

export default App;