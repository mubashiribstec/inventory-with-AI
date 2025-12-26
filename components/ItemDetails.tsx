
import React, { useState, useEffect } from 'react';
import { InventoryItem, ItemStatus } from '../types';
import { GoogleGenAI } from "@google/genai";

interface ItemDetailsProps {
  item: InventoryItem;
}

const ItemDetails: React.FC<ItemDetailsProps> = ({ item }) => {
  const [specs, setSpecs] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchSpecs = async () => {
      const apiKey = process.env.API_KEY;
      if (!apiKey) return;

      setIsLoading(true);
      try {
        const ai = new GoogleGenAI({ apiKey });
        const prompt = `Provide common technical specifications for this hardware model: "${item.name}". 
        Include Processor, RAM options, Storage type, and Display size if applicable. 
        Format as a clean markdown list with bold labels. Be professional and concise.`;

        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: prompt,
          config: {
            systemInstruction: "You are a hardware expert. Provide realistic technical specs for common hardware models."
          }
        });

        setSpecs(response.text || "Specifications unavailable for this model.");
      } catch (err) {
        console.error("Gemini Specs Error", err);
        setSpecs("Unable to load specifications.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSpecs();
  }, [item.name]);

  const getStatusBadge = (status: ItemStatus) => {
    switch (status) {
      case ItemStatus.IN_USE: return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case ItemStatus.ASSIGNED: return 'bg-blue-50 text-blue-600 border-blue-100';
      case ItemStatus.AVAILABLE: return 'bg-indigo-50 text-indigo-600 border-indigo-100';
      case ItemStatus.BACKUP: return 'bg-amber-50 text-amber-600 border-amber-100';
      case ItemStatus.FAULTY: return 'bg-rose-50 text-rose-600 border-rose-100';
      default: return 'bg-slate-50 text-slate-600 border-slate-100';
    }
  };

  return (
    <div className="space-y-8">
      {/* Header Info */}
      <div className="flex items-start gap-6">
        <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center text-3xl shadow-inner">
          <i className={`fas ${item.category === 'Computers' ? 'fa-laptop' : 'fa-box-open'}`}></i>
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <h2 className="text-2xl font-bold text-slate-800 poppins">{item.name}</h2>
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${getStatusBadge(item.status)}`}>
              {item.status.replace('-', ' ')}
            </span>
          </div>
          <p className="text-slate-500 font-medium text-sm flex items-center gap-4">
            <span><i className="fas fa-fingerprint mr-1.5 text-slate-300"></i> {item.id}</span>
            <span><i className="fas fa-barcode mr-1.5 text-slate-300"></i> {item.serial}</span>
          </p>
        </div>
      </div>

      {/* Detail Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-y-6 gap-x-10 p-6 bg-slate-50 rounded-3xl border border-slate-100">
        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Category</label>
          <p className="text-sm font-bold text-slate-700">{item.category}</p>
        </div>
        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Location</label>
          <p className="text-sm font-bold text-slate-700">{item.location || 'Not Set'}</p>
        </div>
        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Assigned To</label>
          <p className="text-sm font-bold text-slate-700">{item.assignedTo || '-'}</p>
        </div>
        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Department</label>
          <p className="text-sm font-bold text-slate-700">{item.department || '-'}</p>
        </div>
        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Purchase Date</label>
          <p className="text-sm font-bold text-slate-700">{item.purchaseDate}</p>
        </div>
        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Warranty Until</label>
          <p className={`text-sm font-bold ${new Date(item.warranty) < new Date() ? 'text-rose-500' : 'text-slate-700'}`}>
            {item.warranty}
          </p>
        </div>
        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Estimated Cost</label>
          <p className="text-sm font-bold text-slate-700">${item.cost?.toLocaleString() || '0.00'}</p>
        </div>
      </div>

      {/* AI Intelligence Specs */}
      <div className="border-t border-slate-100 pt-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center text-white text-xs">
            <i className="fas fa-brain"></i>
          </div>
          <h4 className="font-bold text-slate-800 poppins">Technical Specifications <span className="text-[10px] text-indigo-400 uppercase ml-2">AI Generated</span></h4>
        </div>
        
        {isLoading ? (
          <div className="space-y-3 px-4">
            <div className="h-4 bg-slate-100 rounded-full w-full animate-pulse"></div>
            <div className="h-4 bg-slate-100 rounded-full w-5/6 animate-pulse"></div>
            <div className="h-4 bg-slate-100 rounded-full w-2/3 animate-pulse"></div>
          </div>
        ) : (
          <div className="prose prose-sm max-w-none text-slate-600 px-4 bg-white border border-slate-100 p-5 rounded-2xl shadow-sm">
             {specs ? (
               <div className="whitespace-pre-wrap leading-relaxed">{specs}</div>
             ) : (
               <p className="italic text-slate-400">Configure your Gemini API key to see AI-generated hardware specs.</p>
             )}
          </div>
        )}
      </div>

      <div className="flex gap-4">
          <button className="flex-1 py-3 bg-white border border-slate-200 text-slate-600 rounded-2xl font-bold text-sm hover:bg-slate-50 transition flex items-center justify-center gap-2">
            <i className="fas fa-history"></i> Life Cycle History
          </button>
          <button className="flex-1 py-3 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-2xl font-bold text-sm hover:bg-indigo-100 transition flex items-center justify-center gap-2">
            <i className="fas fa-print"></i> Print QR Label
          </button>
      </div>
    </div>
  );
};

export default ItemDetails;
