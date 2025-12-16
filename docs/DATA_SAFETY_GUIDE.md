# 🛡️ Data Safety & Backup Guide

## Overview

This guide ensures your BharatFlow data is protected and recoverable. Follow these procedures to prevent data loss.

---

## 🚨 CRITICAL: Commands to AVOID

These commands will **DESTROY YOUR DATA**. Never run them unless you intentionally want to reset everything:

### ❌ Dangerous Commands

```bash
# This removes all Docker volumes including your database data!
docker-compose down -v

# This resets your entire database to empty state!
npx prisma migrate reset

# This removes the specific PostgreSQL volume!
docker volume rm server_pgdata

# This removes ALL unused Docker volumes!
docker volume prune
```

### ✅ Safe Commands

```bash
# Stop containers but keep data
docker-compose down

# Restart containers with existing data
docker-compose up -d

# View running containers
docker ps

# Check volume exists
docker volume ls | grep pgdata
```

---

## 📦 Automated Backup System

### Create a Backup

Run anytime to create a timestamped backup:

```bash
npm run backup
```

This will:
- Create a backup in `server/backups/` folder
- Include timestamp in filename
- Keep last 7 backups (older ones auto-deleted)
- Show backup file size

### Restore from Backup

To restore your database from a backup:

```bash
npm run restore
```

This will:
- Show list of available backups
- Let you choose which one to restore
- Ask for confirmation before restoring
- Restore the selected backup

**⚠️ Warning:** Restoring will overwrite current data!

---

## 🔍 Data Integrity Check

Check your database health anytime:

```bash
npm run check-data
```

This verifies:
- ✅ Docker container is running
- ✅ Database volume exists  
- ✅ Database connection works
- ✅ Record counts in all tables
- ⚠️  Warns if no users/companies found

Run this:
- After every backup
- Before making major changes
- If you suspect data issues
- Daily in production

---

## 📅 Recommended Backup Schedule

### Development
- **Manual:** Before major changes
- **Automated:** Daily (optional)

### Production
- **Automated:** Every 6 hours
- **Weekly:** Full system backup
- **Monthly:** Archive old backups

---

## 🔄 Docker Volume Management

### Check Volume Status

```bash
# List volumes
docker volume ls

# Inspect PostgreSQL volume
docker volume inspect server_pgdata

# Check volume size
docker system df -v
```

### Verify Data Persists

1. Create a test user
2. Stop containers: `docker-compose down`
3. Start containers: `docker-compose up -d`
4. Verify user still exists

---

## 💾 Backup Storage Best Practices

### Local Backups (Current Setup)
- Location: `server/backups/`
- Rotation: 7 days
- Manual execution

### Enhanced Backup Strategy (Recommended for Production)

1. **Cloud Storage**
   - Upload to Google Drive / Dropbox
   - Use AWS S3 or Azure Blob Storage
   - Encrypt before upload

2. **External Drive**
   - Copy to external HDD/SSD
   - Keep off-site copy

3. **Version Control**
   - Git-ignore backup files (too large)
   - Store schema migrations only

---

## 🆘 Recovery Procedures

### Scenario 1: Accidental Data Deletion

```bash
# 1. Stop the server
# 2. Restore from latest backup
npm run restore

# 3. Verify data
npm run check-data

# 4. Restart server
npm run dev
```

### Scenario 2: Volume Lost

If `docker volume ls` doesn't show `server_pgdata`:

```bash
# 1. Recreate volume
docker-compose up -d

# 2. Restore from backup
npm run restore

# 3. Verify
npm run check-data
```

### Scenario 3: Database Corrupted

```bash
# 1. Check Docker logs
docker logs bharatflow_postgres

# 2. Try restarting container
docker-compose restart postgres

# 3. If still broken, restore from backup
npm run restore
```

---

## 🔐 Security Best Practices

1. **Backup Encryption**
   - Encrypt backups before storing remotely
   - Don't commit backups to Git

2. **Access Control**
   - Limit who can run restore operations
   - Keep production backups separate

3. **Regular Testing**
   - Test restore process monthly
   - Verify restored data integrity

---

## 📝 Database Migration Safety

When running Prisma migrations:

```bash
# ✅ SAFE: Create backup first
npm run backup
npx prisma migrate dev

# ❌ DANGEROUS: Never use reset in production!
npx prisma migrate reset  # DON'T DO THIS!
```

---

## 🚀 Quick Reference

| Task | Command | Frequency |
|------|---------|-----------|
| Create Backup | `npm run backup` | Before changes |
| Restore Backup | `npm run restore` | When needed |
| Check Data | `npm run check-data` | Daily |
| View Backups | Check `server/backups/` | - |
| Clean Old Backups | Auto (keeps 7) | Automatic |

---

## 🔧 Troubleshooting

### Backup Fails
- Check Docker is running: `docker ps`
- Verify container exists: `docker ps -a | grep bharatflow_postgres`
- Check disk space: `docker system df`

### Restore Fails
- Ensure backup file exists
- Verify Docker container is running
- Check database connection

### Data Still Missing After Restore
- Verify correct backup file was selected
- Check if backup file has content (> 0 KB)
- Review backup creation logs

---

## 📞 Emergency Contacts

If you lose data:
1. **STOP** - Don't make changes
2. **CHECK** - Run integrity check
3. **BACKUP** - Make backup of current state
4. **RESTORE** - Restore from known good backup
5. **VERIFY** - Check data integrity

---

## ✅ Pre-Deployment Checklist

Before deploying to production:

- [ ] Test backup creation
- [ ] Test backup restoration
- [ ] Verify volume persistence
- [ ] Set up automated backups
- [ ] Document recovery procedures
- [ ] Train team on safety protocols
- [ ] Test disaster recovery plan

---

**Remember:** An ounce of prevention is worth a pound of cure! Make backups a habit, not an afterthought.
