import React, { useState } from 'react';
import { useData } from '../context/DataContext';

interface AdminActivitiesProps {
    selectedId?: string;
}

const AdminActivities: React.FC<AdminActivitiesProps> = ({ selectedId }) => {
    const { jumuiyaList, updateMeetingSchedule } = useData();
    const [selectedJumuiyaId, setSelectedJumuiyaId] = useState(selectedId || jumuiyaList[0]?.id || '');

    const selectedJumuiya = jumuiyaList.find((j: any) => j.id === selectedJumuiyaId);

    // Meeting Schedule State
    const [day, setDay] = useState('');
    const [time, setTime] = useState('');
    const [venue, setVenue] = useState('');

    // Load initial data when jumuiya changes
    React.useEffect(() => {
        if (selectedJumuiya) {
            setDay(selectedJumuiya.meetingSchedule.day);
            setTime(selectedJumuiya.meetingSchedule.time);
            setVenue(selectedJumuiya.meetingSchedule.venue);
        }
    }, [selectedJumuiya]);

    const handleSaveSchedule = (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedJumuiya) {
            updateMeetingSchedule(selectedJumuiyaId, {
                day,
                time,
                venue
            });
            alert('Meeting schedule updated!');
        }
    };

    return (
        <div style={{ '--admin-theme-color': selectedJumuiya?.color } as React.CSSProperties}>
            <div className="admin-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h2 style={{ width: '240px', margin: 0, border: 'none' }}>Manage Activities</h2>
                    {!selectedId && (
                        <select
                            value={selectedJumuiyaId}
                            onChange={(e) => setSelectedJumuiyaId(e.target.value)}
                            style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                        >
                            {jumuiyaList.map((j: any) => (
                                <option key={j.id} value={j.id}>{j.name}</option>
                            ))}
                        </select>
                    )}
                </div>

                <h3>Meeting Schedule</h3>
                <form onSubmit={handleSaveSchedule}>
                    <div className="form-group">
                        <label>Meeting Day</label>
                        <select
                            value={day}
                            onChange={(e) => setDay(e.target.value)}
                            required
                        >
                            <option value="">Select Day</option>
                            <option value="Every Sunday">Every Sunday</option>
                            <option value="Every Monday">Every Monday</option>
                            <option value="Every Tuesday">Every Tuesday</option>
                            <option value="Every Wednesday">Every Wednesday</option>
                            <option value="Every Thursday">Every Thursday</option>
                            <option value="Every Friday">Every Friday</option>
                            <option value="Every Saturday">Every Saturday</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Time</label>
                        <input
                            type="text"
                            value={time}
                            onChange={(e) => setTime(e.target.value)}
                            placeholder="e.g. 2:00 PM - 4:00 PM"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Venue</label>
                        <input
                            type="text"
                            value={venue}
                            onChange={(e) => setVenue(e.target.value)}
                            placeholder="e.g. Parish Hall"
                            required
                        />
                    </div>

                    <button type="submit" className="btn-primary">Update Schedule</button>
                </form>

                <hr style={{ margin: '30px 0', border: 'none', borderTop: '1px solid #eee' }} />

                <div style={{ padding: '15px', background: '#eff6ff', borderRadius: '8px', color: '#1e40af' }}>
                    <strong>Note:</strong> Future versions will support adding special events and calendar activities.
                    Currently, you can only manage the weekly meeting schedule.
                </div>
            </div>
        </div>
    );
};

export default AdminActivities;
