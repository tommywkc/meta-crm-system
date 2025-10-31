import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { handleCreate } from '../../api/customersListAPI';

const CustomerCreate = () => {
  const navigate = useNavigate();

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newCustomer = {
      password,
      name,
      mobile,
      email,
      role,
      source,
      owner_sales: ownerSales,
      team,
      tags,
      note_special: specialNotes,
    };
    console.log('Creating customer:', newCustomer);
    try {
      console.log('Creating new customer...', newCustomer);
      const res = await handleCreate(newCustomer); // 呼叫 API 建立新客戶
      console.log('Create success:', res);

      alert('客戶新增成功！');
      navigate('/customers');  // 建立完導回客戶清單
    } catch (err) {
      console.error('Create failed:', err);
      alert('新增客戶失敗，請稍後再試');
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>新增客戶(Admin)</h1>
      <form onSubmit={handleSubmit} style={{ marginTop: 12, maxWidth: 600 }}>
        <div style={{ marginBottom: 8 }}>
          <label>Name:</label>
          <br />
          <input 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
            style={{ width: '100%', padding: 8 }} required
          />
        </div>
        <div style={{ marginBottom: 8 }}>
          <label>Mobile Number:</label>
          <br />
          <input 
            value={mobile} 
            onChange={(e) => setMobile(e.target.value)} 
            style={{ width: '100%', padding: 8 }} required
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
            style={{ width: '103%', padding: 8 }}
          >
            <option value="MEMBER">MEMBER</option>
            <option value="SALES">SALES</option>
            <option value="LEADER">LEADER</option>
            <option value="ADMIN">ADMIN</option>
          </select> required
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
          <label>Owner Sales:</label><br/>
          <input
            type="text"
            value={ownerSales}
            onChange={(e) => setOwnerSales(e.target.value)}
            style={{ width: '100%', padding: 8, borderColor: !/^\d*$/.test(ownerSales || '') ? 'red' : '' }}
          />
          {!/^\d*$/.test(ownerSales || '') && (
            <small style={{ color: 'red' }}>Please only enter sales ID.</small>
          )}
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
          <button type="submit" style={{ marginRight: 8 }}>Create</button>
          <button type="button" onClick={() => navigate(-1)}>Cancel</button>
        </div>
      </form>
    </div>
  );
};

export default CustomerCreate;