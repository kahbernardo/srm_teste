# 🐛 Known Issues - SRM Credit Engine

## Issue #1: Empty Response on Single Transaction Endpoints

**Status**: 🔴 OPEN (In Investigation)  
**Severity**: Medium (Workaround available)  
**Affected Endpoints**:
- `GET /api/v1/transactions/:id`
- `POST /api/v1/transactions` (response only, functionality works)
- `POST /api/v1/transactions/:id/settle` (response only, functionality works)

### Description

Endpoints that return single transaction objects return `{"success": true, "data": {}}` with empty data object, even though the operation completes successfully.

### Symptoms

```bash
# POST creates transaction successfully but returns empty data
curl -X POST http://localhost:4000/api/v1/transactions -d '{...}'
# Response: {"success": true, "data": {}}

# However, transaction IS created (verified via GET /transactions list)
curl http://localhost:4000/api/v1/transactions
# Response: {"success": true, "data": [{...}], "count": 1}  ✅ WORKS
```

### What Works

- ✅ `GET /api/v1/transactions` (list) - Returns full data
- ✅ `GET /api/v1/currencies` - Returns full data
- ✅ `GET /api/v1/asset-types` - Returns full data
- ✅ Debug endpoints (`/debug-get/:id`, `/debug-service`) - Returns full data
- ✅ Service layer - Returns correct objects
- ✅ Database operations - All successful

### What Doesn't Work

- ❌ Single object endpoints via controllers - Returns `data: {}`

### Investigation Results

**Tested Approaches:**
1. ❌ Decimal serialization helper - No effect
2. ❌ JSON.parse/stringify cleaning - No effect
3. ❌ Removing response schemas - No effect
4. ❌ Function-based controllers (vs class methods) - No effect
5. ❌ Direct return (no reply.send) - No effect
6. ❌ Different return patterns - No effect
7. ✅ **Inline handlers** (debug endpoints) - **WORKS!**

**Root Cause Hypothesis:**

Appears to be a serialization issue specific to Fastify + TypeScript + Prisma when:
- Returning single objects (not arrays)
- Through controller functions (not inline handlers)
- With nullable properties

Logs show the object is complete before `reply.send()` but arrives empty at client.

### Workaround

**Option A**: Use list endpoint and filter client-side
```bash
# Instead of GET /transactions/:id
# Use GET /transactions and filter by ID on client
curl 'http://localhost:4000/api/v1/transactions' | jq '.data[] | select(.id == "...")'
```

**Option B**: Use debug endpoints (temporary)
```bash
curl 'http://localhost:4000/debug-get/:id'  # Full response
```

**Option C**: Check operation success via list
```bash
# 1. POST transaction (ignore empty response)
curl -X POST .../transactions -d '{...}'

# 2. Verify via list
curl '.../transactions' | jq '.data[0]'  # Latest transaction
```

### Impact

- **Functionality**: ✅ All operations work correctly
- **Data persistence**: ✅ All data saved properly
- **User Experience**: ⚠️ Requires workaround
- **API usability**: ⚠️ Not ideal but manageable

### Next Steps

1. **Short term**: Document workarounds (this file)
2. **Medium term**: Investigate Fastify serializer configuration
3. **Long term**: Consider refactoring to inline handlers or different framework

### Possible Solutions to Try

- [ ] Configure Fastify custom serializer
- [ ] Use fast-json-stringify explicitly
- [ ] Remove all response schemas
- [ ] Migrate controllers to inline handlers
- [ ] Test with different Fastify version
- [ ] Test with PostgreSQL (vs SQLite)
- [ ] Add custom toJSON() methods to Prisma models

### References

- [Fastify Serialization Docs](https://fastify.dev/docs/latest/Reference/Serialization/)
- [Prisma JSON Serialization](https://www.prisma.io/docs/orm/prisma-client/queries/custom-validation)

---

**Last Updated**: 2026-07-03  
**Investigated By**: Claude Sonnet 4.5  
**Status**: Documented, workarounds available, non-blocking
