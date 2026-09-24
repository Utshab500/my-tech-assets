# Why a New HSM Automatically Gets the Last Backup State

When you add a new HSM to an existing CloudHSM cluster that has **no other active HSMs**,
AWS automatically restores the cluster's key material into it. This page explains the
mechanism behind that behaviour.

---

## The Two Layers: Cluster vs. HSM

AWS CloudHSM separates two concepts that are easy to conflate:

| Concept | What it is |
|---|---|
| **Cluster** | A logical grouping that holds the cluster's domain key, policy, and backup history |
| **HSM** | A physical hardware device inside the cluster that actually stores and executes on key material |

The cluster is never deleted when you delete an HSM — it persists as a control-plane
object in AWS. This is the root of the auto-restore behaviour.

---

## The Domain Key — The Real Secret Keeper

Every CloudHSM cluster has a **domain key** (also called the cluster key). This key is:

- Generated once at cluster initialization time
- Never exposed outside the HSM hardware
- Used to **encrypt every backup** AWS takes of the cluster

When AWS stores a backup, it stores the HSM's key material encrypted under the domain key.
The domain key itself is held in AWS's secure backup infrastructure, tied to your cluster ID.

---

## What Happens Step by Step When You `create-hsm`

```
aws cloudhsmv2 create-hsm --cluster-id <id> --availability-zone <az>
```

1. **AWS provisions a blank HSM device** in the requested AZ.

2. **AWS checks for peer HSMs** already active in the cluster.
   - If peers exist → skip to step 3a (clone path).
   - If no peers exist → go to step 3b (backup path).

3a. **Clone path (live peers exist)**
    - The new HSM and a peer perform a mutual TLS handshake using their hardware-attested certificates.
    - The peer pushes all key material directly to the new HSM over an encrypted channel.
    - The domain key is also transferred. No backup is read from AWS storage.
    - Result: new HSM is in sync with the cluster's current state (no backup lag).

3b. **Backup path (no live peers — your POC scenario)**
    - AWS fetches the cluster's **most recent backup** from its secure backup store.
    - The backup is decrypted using the cluster's domain key (which AWS holds for your cluster).
    - Key material is loaded into the new blank HSM.
    - Result: new HSM contains everything up to the point of the last backup.

4. **HSM state transitions**: `CREATE_IN_PROGRESS` → `ACTIVE`

---

## Why You Cannot Choose Which Backup (Option A)

In Option A you are adding an HSM to an **existing cluster**. The cluster entity itself
determines which backup is used — always the latest one. AWS does not expose a
"restore-from-backup-id" parameter on `create-hsm`.

To restore from a **specific backup**, you must create a **new cluster** with
`source_backup_identifier` (Option B). The new cluster is seeded from that exact snapshot,
then you add an HSM to it.

---

## The Data Loss Window

Because Option A always uses the **latest backup**, any keys created after the last backup
but before the HSM was deleted are permanently lost.

```
Timeline:

  [Backup N taken]──────────────[Key X created]──────[HSM deleted]
        │                              │                    │
        └── restored ✓                └── NOT restored ✗   │
                                                            │
                                               New HSM added here
```

This is why Phase 5 of the POC triggers a manual backup **before** deleting the HSM —
it closes the window by making the last backup as fresh as possible.

---

## Cluster vs. HSM Deletion — Key Distinction

| Action | What survives |
|---|---|
| `delete-hsm` | Cluster persists; domain key and backups remain in AWS |
| `delete-cluster` | Cluster removed; backups become orphaned (kept 90 days, then purged) |

If you delete the **cluster** itself, the domain key used to decrypt backups is eventually
destroyed, making those backups unrecoverable. This is why `delete-cluster` is a
highly destructive, irreversible action.

---

## Summary

The auto-restore on `create-hsm` works because:
1. The **cluster object persists** even after all HSMs are deleted.
2. AWS holds the **domain key** tied to your cluster ID in its secure infrastructure.
3. The latest backup is always encrypted with that domain key, so AWS can decrypt and
   inject it into any new HSM provisioned for that cluster — automatically, without
   any action from you.
