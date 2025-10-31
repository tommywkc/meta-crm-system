import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const CustomerCreate = () => {
  const navigate = useNavigate();

  const [userID, setUserID] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('MEMBER');
  const [source, setSource] = useState('');
  const [ownerSales, setOwnerSales] = useState('');
  const [team, setTeam] = useState('');
  const [tags, setTags] = useState('');
  const [specialNotes, setSpecialNotes] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    // For now, just log the values and navigate back
    console.log('Create customer (mock):', { userID, password, name, mobile, email, role, source, ownerSales, team, tags, specialNotes });
    alert('已模擬新增（不會真的送出）');
    navigate('/customers');
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>新增客戶(Admin)</h1>
      <form onSubmit={handleSubmit} style={{ marginTop: 12, maxWidth: 600 }}>
        <div style={{ marginBottom: 8 }}>
          <label>UserID:</label>
          <br />
          <input 
            value={userID} 
            onChange={(e) => setUserID(e.target.value)} 
            style={{ width: '100%', padding: 8 }} 
          />
        </div>
        <div style={{ marginBottom: 8 }}>
          <label>Password:</label>
          <br />
          <input 
            type="password"
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            style={{ width: '100%', padding: 8 }} 
          />
        </div>
        <div style={{ marginBottom: 8 }}>
          <label>Name:</label>
          <br />
          <input 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
            style={{ width: '100%', padding: 8 }} 
          />
        </div>
        <div style={{ marginBottom: 8 }}>
          <label>Mobile Number:</label>
          <br />
          <input 
            value={mobile} 
            onChange={(e) => setMobile(e.target.value)} 
            style={{ width: '100%', padding: 8 }} 
          />
        </div>
        <div style={{ marginBottom: 8 }}>
          <label>Email:</label>
          <br />
          <input 
            type="email"
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            style={{ width: '100%', padding: 8 }} 
          />
        </div>
        <div style={{ marginBottom: 8 }}>
          <label>Role:</label>
          <br />
          <select 
            value={role} 
            onChange={(e) => setRole(e.target.value)} 
            style={{ width: '100%', padding: 8 }}
          >
            <option value="MEMBER">MEMBER</option>
            <option value="SALES">SALES</option>
            <option value="LEADER">LEADER</option>
            <option value="ADMIN">ADMIN</option>
          </select>
        </div>
        <div style={{ marginBottom: 8 }}>
          <label>Source:</label>
          <br />
          <input 
            value={source} 
            onChange={(e) => setSource(e.target.value)} 
            style={{ width: '100%', padding: 8 }} 
          />
        </div>
        <div style={{ marginBottom: 8 }}>
          <label>Owner Sales:</label>
          <br />
          <input 
            value={ownerSales} 
            onChange={(e) => setOwnerSales(e.target.value)} 
            style={{ width: '100%', padding: 8 }} 
          />
        </div>
        <div style={{ marginBottom: 8 }}>
          <label>Team:</label>
          <br />
          <input 
            value={team} 
            onChange={(e) => setTeam(e.target.value)} 
            style={{ width: '100%', padding: 8 }} 
          />
        </div>
        <div style={{ marginBottom: 8 }}>
          <label>Tags:</label>
          <br />
          <input 
            value={tags} 
            onChange={(e) => setTags(e.target.value)} 
            style={{ width: '100%', padding: 8 }} 
          />
        </div>
        <div style={{ marginBottom: 8 }}>
          <label>Special Notes:</label>
          <br />
          <textarea 
            value={specialNotes} 
            onChange={(e) => setSpecialNotes(e.target.value)} 
            style={{ width: '100%', padding: 8, minHeight: 80 }} 
            rows={3}
          />
        </div>
        <div style={{ marginTop: 12 }}>
          <button type="submit" style={{ marginRight: 8 }}>新增</button>
          <button type="button" onClick={() => navigate(-1)}>取消</button>
        </div>
      </form>
    </div>
  );
};

export default CustomerCreate;